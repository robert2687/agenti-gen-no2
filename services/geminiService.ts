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

const mockTodoAppCodeV3 = `
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced To-Do App</title>
    <style>
        :root {
            --bg-color: #1a1a2e;
            --primary-color: #16213e;
            --secondary-color: #0f3460;
            --accent-color: #e94560;
            --text-color: #dcdcdc;
            --border-radius: 8px;
            --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            --transition-speed: 0.3s;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            margin: 0;
            padding: 2rem;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
        }
        .container {
            width: 100%;
            max-width: 500px;
            background: var(--primary-color);
            padding: 2rem;
            border-radius: var(--border-radius);
            box-shadow: var(--box-shadow);
        }
        h1 {
            text-align: center;
            color: var(--accent-color);
            margin-bottom: 1.5rem;
        }
        .input-area {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
        }
        #task-input {
            flex-grow: 1;
            padding: 0.75rem;
            border: 2px solid var(--secondary-color);
            background-color: var(--bg-color);
            color: var(--text-color);
            border-radius: var(--border-radius);
            font-size: 1rem;
            transition: border-color var(--transition-speed);
        }
        #task-input:focus {
            outline: none;
            border-color: var(--accent-color);
        }
        #add-task-btn {
            padding: 0.75rem 1.5rem;
            background-color: var(--accent-color);
            color: var(--text-color);
            border: none;
            border-radius: var(--border-radius);
            cursor: pointer;
            font-weight: bold;
            transition: background-color var(--transition-speed);
        }
        #add-task-btn:hover {
            background-color: #ff5c77;
        }
        #task-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .task-item {
            display: flex;
            align-items: center;
            padding: 0.75rem;
            background-color: var(--secondary-color);
            border-radius: var(--border-radius);
            margin-bottom: 0.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: transform var(--transition-speed), opacity var(--transition-speed), background-color var(--transition-speed);
            opacity: 1;
            transform: scale(1);
        }
        .task-item:hover {
            background-color: #1a4a8a;
        }
        .task-item.adding {
            animation: fadeIn 0.5s ease;
        }
        .task-item.deleting {
            transform: scale(0.9);
            opacity: 0;
        }
        .task-item input[type="checkbox"] {
            margin-right: 0.75rem;
            width: 18px;
            height: 18px;
        }
        .task-item .task-text {
            flex-grow: 1;
            cursor: default;
        }
        .task-item.completed .task-text {
            text-decoration: line-through;
            color: #888;
        }
        .task-item .edit-input {
            flex-grow: 1;
            background: none;
            border: none;
            color: var(--text-color);
            font-size: inherit;
            font-family: inherit;
            padding: 0;
            margin: 0;
            border-bottom: 2px solid var(--accent-color);
        }
        .task-item .edit-input:focus {
            outline: none;
        }
        .task-item .actions {
            display: flex;
            gap: 0.5rem;
        }
        .task-item button {
            background: none;
            border: none;
            color: var(--text-color);
            cursor: pointer;
            padding: 0.25rem;
            opacity: 0.7;
            transition: opacity var(--transition-speed);
        }
        .task-item button:hover {
            opacity: 1;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>My To-Do List</h1>
        <div class="input-area">
            <input type="text" id="task-input" placeholder="Add a new task..." aria-label="New task input">
            <button id="add-task-btn">Add</button>
        </div>
        <ul id="task-list" aria-live="polite"></ul>
    </div>

    <script>
        const taskInput = document.getElementById('task-input');
        const addTaskBtn = document.getElementById('add-task-btn');
        const taskList = document.getElementById('task-list');

        let tasks = [];
        let editingTaskId = null;

        const saveTasks = () => {
            try {
                localStorage.setItem('tasks', JSON.stringify(tasks));
            } catch (e) {
                console.error("Failed to save tasks to localStorage", e);
                alert("Could not save your tasks. Your browser's storage might be full or disabled.");
            }
        };

        const loadTasks = () => {
            try {
                const storedTasks = localStorage.getItem('tasks');
                return storedTasks ? JSON.parse(storedTasks) : [];
            } catch (e) {
                console.error("Failed to load tasks from localStorage", e);
                alert("Could not load your saved tasks. Starting with an empty list.");
                return [];
            }
        };

        const renderTasks = () => {
            taskList.innerHTML = '';
            tasks.forEach(task => {
                const li = document.createElement('li');
                li.className = 'task-item';
                if (task.completed) {
                    li.classList.add('completed');
                }
                li.setAttribute('data-id', task.id);
                
                const isEditing = task.id === editingTaskId;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = task.completed;
                checkbox.setAttribute('aria-label', 'Mark task as complete');
                checkbox.addEventListener('change', () => {
                    task.completed = checkbox.checked;
                    saveTasks();
                    renderTasks();
                });

                li.appendChild(checkbox);

                if (isEditing) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = task.text;
                    input.className = 'edit-input';
                    
                    const handleUpdate = () => {
                        const newText = input.value.trim();
                        if (newText) {
                            task.text = newText;
                        }
                        editingTaskId = null;
                        saveTasks();
                        renderTasks();
                    };
                    
                    input.addEventListener('blur', handleUpdate);
                    input.addEventListener('keydown', e => {
                        if (e.key === 'Enter') {
                            handleUpdate();
                        } else if (e.key === 'Escape') {
                            editingTaskId = null;
                            renderTasks();
                        }
                    });
                    li.appendChild(input);
                    // Defer focus to allow the element to be appended to the DOM
                    setTimeout(() => input.focus(), 0);

                } else {
                    const span = document.createElement('span');
                    span.className = 'task-text';
                    span.textContent = task.text;
                    li.appendChild(span);

                    const actionsDiv = document.createElement('div');
                    actionsDiv.className = 'actions';

                    const editBtn = document.createElement('button');
                    editBtn.innerHTML = '✏️';
                    editBtn.setAttribute('aria-label', 'Edit task');
                    editBtn.addEventListener('click', () => {
                        editingTaskId = task.id;
                        renderTasks();
                    });

                    const deleteBtn = document.createElement('button');
                    deleteBtn.innerHTML = '🗑️';
                    deleteBtn.setAttribute('aria-label', 'Delete task');
                    deleteBtn.addEventListener('click', () => {
                        li.classList.add('deleting');
                        li.addEventListener('transitionend', () => {
                            tasks = tasks.filter(t => t.id !== task.id);
                            saveTasks();
                            renderTasks();
                        });
                    });

                    actionsDiv.appendChild(editBtn);
                    actionsDiv.appendChild(deleteBtn);
                    li.appendChild(actionsDiv);
                }
                
                taskList.appendChild(li);
            });
        };

        const addTask = () => {
            const taskText = taskInput.value.trim();
            if (taskText === '') return;

            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
            };

            tasks.push(newTask);
            saveTasks();
            renderTasks();
            
            const newItem = taskList.lastChild;
            if (newItem) {
                newItem.classList.add('adding');
            }

            taskInput.value = '';
            taskInput.focus();
        };

        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                addTask();
            }
        });

        // Initial load
        tasks = loadTasks();
        renderTasks();
    </script>
</body>
</html>
\`\`\`
`;


const mockResponses: Record<string, string[]> = {
  Planner: ["Generating project plan...", "Defining user stories...", "Finalizing tech stack... Done."],
  Architect: ["Designing database schema...", "Creating API contracts...", "Establishing security model... Done."],
  Coder: [mockTodoAppCodeV3],
  Reviewer: ["Auditing code for security vulnerabilities...", "Checking for performance bottlenecks...", "Suggesting improvements... Done."],
  Deployer: ["Writing deployment script...", "Configuring CI/CD pipeline...", "Documenting steps... Done."],
};

const runMockAgentStream = async (agent: Agent, onChunk: (chunk: string) => void): Promise<string> => {
    let fullOutput = "";
    const mockChunks = mockResponses[agent.name] || ["Processing...", "Done."];
    for (const chunk of mockChunks) {
        await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 50));
        // For Coder agent, just send the whole block at once
        if (agent.name === 'Coder') {
            fullOutput = chunk;
            onChunk(chunk);
            break;
        }
        const formattedChunk = `\n- ${chunk}`;
        fullOutput += formattedChunk;
        onChunk(formattedChunk);
    }
    return fullOutput;
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
