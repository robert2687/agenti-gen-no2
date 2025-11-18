<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Agentic AI App Generator

A production-ready React + TypeScript application that uses AI agents to generate complete web applications. This tool orchestrates multiple specialized AI agents (Planner, Architect, Coder, Reviewer, Deployer) to collaboratively build applications from natural language descriptions.

View your app in AI Studio: https://ai.studio/apps/drive/1lMkWRMLfzFbe2WfCJspV5J_61q-o1vTk

## Features

- 🤖 **Multi-Agent System**: Five specialized AI agents work together to create complete applications
- 🎨 **Modern UI**: Built with React 19, TypeScript, and Tailwind CSS
- ⚡ **Fast Development**: Vite for instant hot module replacement
- 🔒 **Type Safety**: Strict TypeScript configuration for maximum type safety
- 📝 **Code Quality**: ESLint and Prettier configured for consistent code style
- 🏗️ **Scalable Architecture**: Organized src/ structure for maintainability

## Project Structure

```
.
├── src/
│   ├── app/              # Main application component
│   │   └── App.tsx
│   ├── components/       # Reusable UI components
│   │   ├── icons/        # Icon components
│   │   └── *.tsx
│   ├── lib/              # Shared utilities and constants
│   │   └── constants.ts
│   ├── services/         # API and external service integrations
│   │   └── geminiService.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   └── index.tsx         # Application entry point
├── eslint.config.js      # ESLint configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite build configuration
└── package.json          # Dependencies and scripts
```

## Prerequisites

- **Node.js** (v18 or higher)
- A **Gemini API Key** from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root directory:

```bash
GEMINI_API_KEY=your_api_key_here
```

### 3. Run the development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting without making changes |
| `npm run type-check` | Run TypeScript compiler without emitting files |

## Technology Stack

- **Framework**: React 19
- **Language**: TypeScript 5.8 (with strict mode)
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS (CDN)
- **AI Integration**: Google Gemini API (@google/genai)
- **Code Quality**: ESLint 9 + Prettier 3
- **Type Checking**: TypeScript with strict mode enabled

## Development

### Code Quality

This project enforces strict code quality standards:

- **TypeScript Strict Mode**: All type checks are enforced
- **ESLint**: Configured with TypeScript and React best practices
- **Prettier**: Consistent code formatting across the project

Before committing, ensure:

```bash
npm run lint        # No linting errors
npm run type-check  # No type errors
npm run format      # Code is properly formatted
```

### Architecture

The application follows a modular architecture:

- **App Component** (`src/app/App.tsx`): Main application logic and state management
- **Components** (`src/components/`): Reusable UI components
- **Services** (`src/services/`): External API integrations (Gemini AI)
- **Types** (`src/types/`): Shared TypeScript interfaces and enums
- **Lib** (`src/lib/`): Utility functions and constants

## How It Works

1. **User Input**: Enter a project goal or description
2. **Planner Agent**: Defines requirements, features, and technical stack
3. **Architect Agent**: Designs system architecture and data models
4. **Coder Agent**: Implements the application as a single HTML file
5. **Reviewer Agent**: Audits code for security and best practices
6. **Deployer Agent**: Provides deployment instructions

The agents can communicate with each other for clarifications, ensuring high-quality output.

## Contributing

Contributions are welcome! Please ensure:

1. Code passes all linting checks (`npm run lint`)
2. Types are correct (`npm run type-check`)
3. Code is formatted (`npm run format`)
4. Build succeeds (`npm run build`)

## License

This project is private and not licensed for public use.
