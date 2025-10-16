import type { Agent } from './types';
import { AgentStatus } from './types';

export const AGENTS_CONFIG: Omit<Agent, 'status' | 'input' | 'output'>[] = [
  {
    id: 1,
    name: 'Planner',
    role: "Define the app’s purpose, core features, user flows, and technical stack. Output: structured requirements document.",
  },
  {
    id: 2,
    name: 'Architect',
    role: "Design the system architecture, database schema, API contracts, and security model based on the requirements. Output: architecture blueprint + diagrams (text-based).",
  },
  {
    id: 3,
    name: 'Coder',
    role: "Implement the application based on the architecture. Your output must be a single, self-contained HTML file with embedded CSS (in a `<style>` tag) and JavaScript (in a `<script>` tag). Do not include explanations or markdown formatting, only the raw HTML code inside a single ```html code block. This file will be rendered directly in a browser preview.",
  },
  {
    id: 4,
    name: 'Reviewer',
    role: "Audit the generated code for scalability, security, and best practices. Suggest improvements. Output: review notes + suggested fixes.",
  },
  {
    id: 5,
    name: 'Deployer',
    role: "The Coder agent has produced a single, self-contained HTML file. Provide deployment instructions for this file (e.g., using a static web host like Firebase Hosting, Netlify, or Vercel). Output: step-by-step deployment guide.",
  },
];

export const INITIAL_AGENTS: Agent[] = AGENTS_CONFIG.map(config => ({
  ...config,
  status: AgentStatus.PENDING,
  input: null,
  output: null,
}));