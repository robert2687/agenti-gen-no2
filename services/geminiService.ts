
import { GoogleGenAI } from "@google/genai";
import type { Agent } from '../types';

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

The previous agent provided the following context/input for you:
---
{AGENT_INPUT}
---

YOUR TASK:
Carefully analyze the input and perform your role. Generate the specified output, ensuring it is clear, structured, and ready for the next agent.
Begin your response immediately without any introductory phrases like "Certainly!" or "Here is the output".
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
    console.error("Gemini API call failed:", error);
    throw new Error("Failed to get a response from the AI. Check your API key and network connection.");
  }
};
