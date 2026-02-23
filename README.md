# Visual Flow Builder

A modern, interactive visual flow builder with AI-powered flow generation using the AG-UI protocol.

## Features

- **Visual Canvas**: Drag-and-drop interface with React Flow
- **AI Flow Generation**: Create flows using natural language (AG-UI protocol)
- **Real-time Validation**: Inline validation with error highlighting
- **JSON Import/Export**: Export flows to JSON or import existing flows
- **Live JSON Preview**: See the JSON representation in real-time

## Tech Stack

- React 18 + TypeScript + Vite
- React Flow for visual canvas
- Zustand for state management
- Tailwind CSS + shadcn/ui
- AG-UI Protocol with Gemini/OpenAI

## Quick Start

```bash
npm install
cp .env.example .env  # Add your API key
npm run dev
```

## Environment Variables

```env
# Choose one (Gemini recommended - free tier available)
VITE_GEMINI_API_KEY=your-gemini-key
VITE_OPENAI_API_KEY=your-openai-key
```

## AG-UI Protocol

This app implements the [AG-UI Protocol](https://docs.ag-ui.com) for AI-powered flow generation.

### Try These Commands

- *"Create a software development lifecycle flow"*
- *"Build a user authentication flow"*
- *"Add 5 nodes for e-commerce checkout"*

### How It Works

```
User Input → LLM (Gemini/OpenAI) → Tool Calls → Flow Updates
     ↑                                              ↓
     └──────────── Streaming Response ←────────────┘
```

### Supported Events

| Event | Description |
|-------|-------------|
| `TEXT_MESSAGE_*` | Streaming text responses |
| `TOOL_CALL_*` | Tool execution (addNode, addEdge, etc.) |

### Available Tools

| Tool | Description |
|------|-------------|
| `addNode` | Create a new node |
| `addEdge` | Connect two nodes |
| `updateNode` | Modify node properties |
| `deleteNode` | Remove a node |
| `setStartNode` | Set entry point |

## Project Structure

```
src/
├── ag-ui/           # AG-UI protocol implementation
├── components/      # React components
├── store/           # Zustand state management
└── schemas/         # Zod validation
```

## License

MIT
