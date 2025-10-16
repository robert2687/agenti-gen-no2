
import { GoogleGenAI } from "@google/genai";
import type { Agent, ClarificationRequest } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Using mocked responses.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const MASTER_PROMPT_TEMPLATE = `
You are a specialized AI agent in a team building a complete, production-ready application.
Your designated role is:
**{AGENT_ROLE}**

You must work sequentially. You will receive input from the previous agent in the workflow. Your output will become the input for the next agent.
Do not skip steps. Always validate and refine your work. Ensure your output is modular, reusable, secure, and well-documented.

**Available Tools:**
- **Web Search**: You can use web search to find up-to-date information, research technologies, or access documentation if you encounter limitations or need external data. The results of your search will be integrated into your knowledge base.

The previous agent provided the following context/input for you:
---
{AGENT_INPUT}
---

YOUR TASK:
Carefully analyze the input and perform your role. Utilize your tools when necessary to produce the highest quality output. Generate the specified output, ensuring it is clear, structured, and ready for the next agent.
Begin your response immediately without any introductory phrases like "Certainly!" or "Here is the output".
`;

const CLARIFICATION_PROMPT_TEMPLATE = `
You are the {AGENT_NAME} agent. The Coder agent requires clarification on the architecture you designed.

This was your original architectural blueprint:
---
{CONTEXT}
---

This is the Coder's question:
---
{QUESTION}
---

YOUR TASK:
Provide a direct, concise, and clear answer to the question. Do not be conversational. Your answer will be used by the Coder to proceed with implementation.
Begin your response immediately.
`;


const mockResponses: Record<string, string[]> = {
  Planner: ["Generating project plan...", "Defining user stories...", "Finalizing tech stack... Done."],
  Architect: ["Designing database schema...", "Creating API contracts...", "Establishing security model... Done."],
  Coder: ["Writing React components...", "Implementing backend logic...", "Adding unit tests... Done."],
  Reviewer: ["Auditing code for security vulnerabilities...", "Checking for performance bottlenecks...", "Suggesting improvements... Done."],
  Deployer: ["Writing deployment script...", "Configuring CI/CD pipeline...", "Documenting steps... Done."],
};

const runMockAgentStream = async (agent: Agent, onChunk: (chunk: string) => void): Promise<string> => {
    let fullOutput = "";
    const mockChunks = mockResponses[agent.name] || ["Processing...", "Done."];
    for (const chunk of mockChunks) {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        const formattedChunk = `\n- ${chunk}`;
        fullOutput += formattedChunk;
        onChunk(formattedChunk);
    }
    return `## Mock Output for ${agent.name}\n${fullOutput}`;
};

export const isClarificationRequest = (text: string): ClarificationRequest | null => {
    const trimmedText = text.trim();
    if (!trimmedText.startsWith('{') || !trimmedText.endsWith('}')) {
        return null;
    }
    try {
        const parsed = JSON.parse(trimmedText);
        if (parsed && typeof parsed.ask === 'string' && typeof parsed.question === 'string') {
            return parsed as ClarificationRequest;
        }
    } catch (e) {
        // Not a valid JSON object
    }
    return null;
}

export const getClarificationAnswerStream = async (
  agentToAsk: Agent,
  question: string,
  context: string,
  onChunk: (chunk: string) => void
): Promise<string> => {
    if (!ai) {
        const mockAnswer = `This is a mock answer to the question: "${question}"`;
        await new Promise(resolve => setTimeout(resolve, 1000));
        onChunk(mockAnswer);
        return mockAnswer;
    }

    const prompt = CLARIFICATION_PROMPT_TEMPLATE
        .replace('{AGENT_NAME}', agentToAsk.name)
        .replace('{CONTEXT}', context)
        .replace('{QUESTION}', question);

    try {
        const stream = await ai.models.generateContentStream({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        let fullText = "";
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                onChunk(chunkText);
            }
        }
        return fullText;
    } catch (error) {
        console.error("Gemini API call for clarification failed:", error);
        throw new Error("Failed to get a clarification from the AI.");
    }
};

export const runAgentStream = async (agent: Agent, input: string, onChunk: (chunk: string) => void): Promise<string> => {
  if (!ai) {
    return runMockAgentStream(agent, onChunk);
  }

  const prompt = MASTER_PROMPT_TEMPLATE
    .replace('{AGENT_ROLE}', agent.role)
    .replace('{AGENT_INPUT}', input);

  try {
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    let fullText = "";
    const allGroundingChunks = new Map<string, { uri: string; title: string }>();

    for await (const chunk of stream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(chunkText);
      }
      
      const metadata = chunk.candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        for (const gc of metadata.groundingChunks) {
            if (gc.web?.uri) {
                allGroundingChunks.set(gc.web.uri, {
                    uri: gc.web.uri,
                    title: gc.web.title || gc.web.uri,
                });
            }
        }
      }
    }

    if (allGroundingChunks.size > 0) {
      let sourcesMarkdown = '\n\n---\n\n### Sources\n';
      for (const source of allGroundingChunks.values()) {
          sourcesMarkdown += `- [${source.title}](${source.uri})\n`;
      }
      fullText += sourcesMarkdown;
      onChunk(sourcesMarkdown);
    }
    
    return fullText;

  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get a response from the AI. Check your API key and network connection.");
  }
};
