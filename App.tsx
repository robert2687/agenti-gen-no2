
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Agent, AgentStatus } from './types';
import { INITIAL_AGENTS } from './constants';
import * as geminiService from './services/geminiService';

import Header from './components/Header';
import PromptInput from './components/PromptInput';
import AgentCard from './components/AgentCard';
import AgentDetailView from './components/AgentDetailView';
import PreviewModal from './components/PreviewModal';

const App: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [projectGoal, setProjectGoal] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgentIndex, setSelectedAgentIndex] = useState<number>(0);
  const [currentAgentIndex, setCurrentAgentIndex] = useState<number>(-1);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const coderAgent = useMemo(() => agents.find(a => a.name === 'Coder'), [agents]);

  useEffect(() => {
    if (coderAgent && coderAgent.output) {
      const codeMatch = coderAgent.output.match(/```html\n([\s\S]*?)```/);
      setPreviewCode(codeMatch ? codeMatch[1] : null); // Only show preview if there is a code block
    } else {
      setPreviewCode(null);
    }
  }, [coderAgent, coderAgent?.output]);


  const handleSelectAgent = (index: number) => {
    setSelectedAgentIndex(index);
  };

  const isWorkflowComplete = useMemo(() => {
    return agents.every(agent => agent.status === AgentStatus.COMPLETED);
  }, [agents]);

  const resetWorkflow = () => {
    setAgents(INITIAL_AGENTS);
    setError(null);
    setIsGenerating(false);
    setCurrentAgentIndex(-1);
    setSelectedAgentIndex(0);
    setPreviewCode(null);
    setIsPreviewModalOpen(false);
  };
  
  const handleStartGeneration = useCallback(async () => {
    if (!projectGoal.trim()) {
      setError("Please enter a project goal.");
      return;
    }

    resetWorkflow();
    setIsGenerating(true);

    let currentInput = `The user wants to build an application with the following goal: "${projectGoal}".`;
    const agentStates: Agent[] = [...INITIAL_AGENTS];
    
    for (let i = 0; i < agentStates.length; i++) {
        setCurrentAgentIndex(i);
        setSelectedAgentIndex(i);
        
        let agentInputForRun = currentInput;
        let finalAgentOutput = '';
        let needsClarificationLoop = true;
        
        agentStates[i] = { ...agentStates[i], status: AgentStatus.RUNNING, input: agentInputForRun, output: '' };
        setAgents([...agentStates]);

        while (needsClarificationLoop) {
            needsClarificationLoop = false; // Will be set to true only if a clarification is asked

            const onChunk = (chunk: string) => {
                setAgents(prevAgents => {
                    const updatedAgents = [...prevAgents];
                    const agentToUpdate = updatedAgents[i];
                    if (agentToUpdate) {
                        agentToUpdate.output = (agentToUpdate.output || '') + chunk;
                    }
                    return updatedAgents;
                });
            };

            const streamedOutput = await geminiService.runAgentStream(agentStates[i], agentInputForRun, onChunk);

            if (agentStates[i].name === 'Coder') {
                const request = geminiService.isClarificationRequest(streamedOutput);
                if (request && request.ask === 'Architect') {
                    needsClarificationLoop = true;
                    
                    const questionLog = `\n\n---\n\n**Question to Architect:**\n> ${request.question}\n`;
                    const currentCoderOutput = agentStates[i].output || '';
                    agentStates[i] = { ...agentStates[i], output: currentCoderOutput.replace(streamedOutput, '') + questionLog };
                    setAgents([...agentStates]);

                    const architect = agentStates.find(a => a.name === 'Architect');
                    if (!architect || !architect.output) {
                        throw new Error("Architect agent or its output not found for clarification.");
                    }

                    const onAnswerChunk = (chunk: string) => {
                        setAgents(prev => {
                            const updated = [...prev];
                            if(updated[i]) {
                                updated[i].output = (updated[i].output || '') + chunk;
                            }
                            return updated;
                        });
                    };
                    
                    onAnswerChunk('\n**Architect\'s Answer:**\n> ');
                    const answer = await geminiService.getClarificationAnswerStream(architect, request.question, architect.output, onAnswerChunk);
                    onAnswerChunk('\n\n---\n');

                    const conversationHistory = `${questionLog}\n**Architect's Answer:**\n> ${answer}\n\n---\n`;
                    agentInputForRun = `${currentInput}\n\n**Clarification was needed. Here is the conversation:**${conversationHistory}\n**Now, with this new information, generate the final HTML code.**`;
                    
                    // Keep the conversation log in the output for the next run
                    agentStates[i] = { ...agentStates[i], output: agentStates[i].output || '' }; // Persist the log
                    setAgents([...agentStates]);

                } else {
                    finalAgentOutput = streamedOutput;
                }
            } else {
                finalAgentOutput = streamedOutput;
            }
        }
        
        agentStates[i] = { ...agentStates[i], status: AgentStatus.COMPLETED, output: finalAgentOutput };
        currentInput = `As the ${agentStates[i].name}, you produced this output:\n\n${finalAgentOutput}`;
        setAgents([...agentStates]);
    }
    
    setIsGenerating(false);
    setCurrentAgentIndex(-1);
  }, [projectGoal]);

  const selectedAgent = agents[selectedAgentIndex];

  return (
    <div className="min-h-screen bg-slate-900 font-sans flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4 max-w-screen-2xl mx-auto w-full">
        <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4">
          <PromptInput
            projectGoal={projectGoal}
            setProjectGoal={setProjectGoal}
            onStart={handleStartGeneration}
            onReset={resetWorkflow}
            isGenerating={isGenerating}
            isComplete={isWorkflowComplete}
            onPreview={() => setIsPreviewModalOpen(true)}
          />
          <div className="bg-slate-800/50 rounded-lg p-4 flex-grow">
            <h2 className="text-lg font-bold mb-3 text-sky-400">Agent Workflow</h2>
            <div className="space-y-2">
              {agents.map((agent, index) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgentIndex === index}
                  onClick={() => handleSelectAgent(index)}
                  isCurrent={currentAgentIndex === index}
                />
              ))}
            </div>
          </div>
        </aside>
        <section className="flex-grow rounded-lg bg-slate-800/50 p-1 flex flex-col">
          {selectedAgent ? (
            <AgentDetailView agent={selectedAgent} />
          ) : (
              <div className="flex-grow flex items-center justify-center h-full">
                <p className="text-slate-400">Select an agent to see details.</p>
              </div>
          )}
        </section>
      </main>
      
      {isPreviewModalOpen && previewCode && (
        <PreviewModal code={previewCode} onClose={() => setIsPreviewModalOpen(false)} />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-800 text-white p-4 rounded-lg shadow-lg">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="absolute top-1 right-2 text-xl">&times;</button>
        </div>
      )}
    </div>
  );
};

export default App;
