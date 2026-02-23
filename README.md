# Visual Flow Builder

A modern, interactive visual flow builder application built with React, React Flow, Zustand, and TypeScript. Create, edit, and manage flowcharts with conditional transitions between nodes.

## Features

- **Visual Canvas**: Drag-and-drop interface for creating flowcharts
- **Node Management**: Add, edit, and delete nodes with titles and descriptions
- **Edge Management**: Create conditional transitions between nodes
- **Real-time Validation**: Inline validation with error highlighting
- **JSON Import/Export**: Export flows to JSON or import existing flows
- **Keyboard Shortcuts**: Delete nodes using the Delete key
- **Live JSON Preview**: See the JSON representation of your flow in real-time
- **Start Node Marking**: Mark a node as the starting point

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Flow** for the visual canvas
- **Zustand** for state management
- **Zod** for schema validation
- **Tailwind CSS** + **shadcn/ui** for styling
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## Usage

### Creating a Flow

1. **Add Nodes**: Click the "Add Node" button in the toolbar
2. **Edit Node Properties**: Click on a node to open the sidebar and edit:
   - Node ID (must be unique)
   - Title (required)
   - Description (optional)
   - Set as start node
3. **Create Edges**: 
   - In the sidebar, click "+" to add an outgoing edge
   - Select a target node
   - Enter a condition (e.g., "if user clicks yes")
4. **Connect Nodes Visually**: Drag from a node's bottom handle to another node's top handle

### Keyboard Shortcuts

- **Delete**: Delete the selected node (when not focused on an input field)
- **Backspace**: Delete the selected node (when not focused on an input field)

### Export/Import

- **Export**: Click "Copy" or "Download" in the JSON Preview section at the bottom
- **Import**: Click "Import JSON" and select a valid JSON file

## JSON Schema

The application uses the following JSON structure:

```json
{
  "nodes": [
    {
      "id": "node_1",
      "title": "Welcome Node",
      "description": "Hello! This is the starting point.",
      "position": { "x": 250, "y": 100 },
      "isStart": true,
      "edges": [
        {
          "id": "edge_123",
          "to_node_id": "node_2",
          "condition": "if user accepts",
          "parameters": {}
        }
      ]
    }
  ]
}
```

## Validation Rules

The application validates:

- **Unique Node IDs**: All node IDs must be unique
- **Required Fields**: Title is required for all nodes
- **Start Node**: Exactly one node must be marked as the start node
- **Edge Conditions**: All edges must have a condition
- **Valid Targets**: All edges must point to existing nodes

## Project Structure

```
src/
├── components/
│   ├── canvas/
│   │   ├── FlowCanvas.tsx      # Main React Flow canvas
│   │   └── CustomNode.tsx      # Custom node component
│   ├── sidebar/
│   │   └── NodeSidebar.tsx     # Node editing sidebar
│   ├── preview/
│   │   └── JsonPreview.tsx     # Live JSON preview
│   └── ui/                     # shadcn UI components
├── store/
│   └── flowStore.ts            # Zustand state management
├── schemas/
│   └── flow.schema.ts          # Zod validation schemas
├── hooks/
│   └── useKeyboardShortcuts.ts # Keyboard shortcut handling
├── lib/
│   └── utils.ts                # Utility functions
└── App.tsx                     # Main application component
```

## Design Choices

### State Management (Zustand)
- Chosen for simplicity and minimal boilerplate
- Provides a clean API for managing nodes, edges, and validation
- Easy to test and debug

### Visual Library (React Flow)
- Industry-standard for building node-based UIs
- Handles complex canvas interactions (zoom, pan, drag)
- Provides built-in components for controls and minimap

### Validation (Zod)
- Type-safe schema validation
- Generates TypeScript types automatically
- Provides detailed error messages

### UI Framework (Tailwind + shadcn)
- Rapid development with utility-first CSS
- Consistent, modern design system
- Fully customizable components

## Future Enhancements

Potential enhancements for the flow builder:

- Undo/Redo functionality
- Copy/paste nodes
- Node templates
- Export to different formats (SVG, PNG)
- Collaborative editing

## License

MIT

## Contact

For questions or feedback, please reach out via the submission channel.
