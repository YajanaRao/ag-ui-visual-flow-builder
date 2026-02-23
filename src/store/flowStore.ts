import { create } from 'zustand';
import type { Node as ReactFlowNode, Edge as ReactFlowEdge, XYPosition } from '@xyflow/react';
import type { Node as FlowNode, Edge as FlowEdge, ValidationError } from '../schemas/flow.schema';
import { FlowSchema } from '../schemas/flow.schema';

interface FlowState {
  nodes: FlowNode[];
  selectedNodeId: string | null;
  validationErrors: ValidationError[];
  
  // Actions
  addNode: (position: XYPosition) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  deleteNode: (id: string) => void;
  setStartNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  
  addEdge: (nodeId: string, edge: Partial<FlowEdge>) => void;
  updateEdge: (nodeId: string, edgeId: string, updates: Partial<FlowEdge>) => void;
  deleteEdge: (nodeId: string, edgeId: string) => void;
  
  // Import/Export
  importFlow: (json: string) => { success: boolean; error?: string };
  exportFlow: () => string;
  
  // Validation
  validate: () => boolean;
  
  // React Flow conversion
  getReactFlowNodes: () => ReactFlowNode[];
  getReactFlowEdges: () => ReactFlowEdge[];
  updateNodePosition: (id: string, position: XYPosition) => void;
}

let nodeCounter = 1;

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [
    {
      id: 'node_1',
      title: 'Welcome Node',
      description: 'Hello! This is the starting point.',
      position: { x: 250, y: 100 },
      isStart: true,
      edges: [],
    },
  ],
  selectedNodeId: null,
  validationErrors: [],
  
  addNode: (position) => {
    nodeCounter++;
    const { nodes } = get();
    
    // Calculate a smart position that avoids overlap
    // Find the rightmost and bottommost positions of existing nodes
    let maxX = 0;
    let maxY = 0;
    nodes.forEach((node) => {
      if (node.position.x > maxX) maxX = node.position.x;
      if (node.position.y > maxY) maxY = node.position.y;
    });
    
    // Position new node below and slightly to the right of existing nodes
    // with some offset to avoid overlap
    const smartPosition = {
      x: nodes.length === 0 ? 250 : Math.min(maxX + 50, 600),
      y: nodes.length === 0 ? 100 : maxY + 150,
    };
    
    const newNode: FlowNode = {
      id: `node_${nodeCounter}`,
      title: `Node ${nodeCounter}`,
      description: '',
      position: position.x === 0 && position.y === 0 ? smartPosition : { 
        x: Math.max(50, position.x), 
        y: Math.max(50, position.y) 
      },
      isStart: false,
      edges: [],
    };
    set((state) => ({ nodes: [...state.nodes, newNode] }));
  },
  
  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }));
    // Revalidate after update
    get().validate();
  },
  
  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
    // Remove edges pointing to this node
    set((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        edges: node.edges.filter((edge) => edge.to_node_id !== id),
      })),
    }));
    // Revalidate after deletion
    get().validate();
  },
  
  setStartNode: (id) => {
    set((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        isStart: node.id === id,
      })),
    }));
  },
  
  selectNode: (id) => {
    // Validate before switching nodes
    get().validate();
    set({ selectedNodeId: id });
  },
  
  addEdge: (nodeId, edgeData) => {
    const edgeId = `edge_${Date.now()}`;
    const newEdge: FlowEdge = {
      id: edgeId,
      to_node_id: edgeData.to_node_id || '',
      condition: edgeData.condition || '',
      parameters: edgeData.parameters,
    };
    
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, edges: [...node.edges, newEdge] }
          : node
      ),
    }));
    // Revalidate after adding edge
    get().validate();
  },
  
  updateEdge: (nodeId, edgeId, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              edges: node.edges.map((edge) =>
                edge.id === edgeId ? { ...edge, ...updates } : edge
              ),
            }
          : node
      ),
    }));
    // Revalidate after updating edge
    get().validate();
  },
  
  deleteEdge: (nodeId, edgeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, edges: node.edges.filter((edge) => edge.id !== edgeId) }
          : node
      ),
    }));
    // Revalidate after deleting edge
    get().validate();
  },
  
  importFlow: (json) => {
    try {
      const data = JSON.parse(json);
      const result = FlowSchema.safeParse(data);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error.issues.map((e) => e.message).join(', '),
        };
      }
      
      set({ nodes: result.data.nodes, selectedNodeId: null });
      get().validate();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
  },
  
  exportFlow: () => {
    const { nodes } = get();
    return JSON.stringify({ nodes }, null, 2);
  },
  
  validate: () => {
    const { nodes } = get();
    const errors: ValidationError[] = [];
    
    // Check for unique IDs
    const ids = nodes.map((n) => n.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    duplicates.forEach((id) => {
      errors.push({ nodeId: id, field: 'id', message: 'Node ID must be unique' });
    });
    
    // Check for start node
    const startNodes = nodes.filter((n) => n.isStart);
    if (startNodes.length === 0) {
      errors.push({ field: 'start', message: 'A start node is required' });
    }
    if (startNodes.length > 1) {
      errors.push({ field: 'start', message: 'Only one start node allowed' });
    }
    
    // Validate each node
    nodes.forEach((node) => {
      if (!node.title) {
        errors.push({ nodeId: node.id, field: 'title', message: 'Title is required' });
      }
      
      // Validate edges
      node.edges.forEach((edge) => {
        if (!edge.condition) {
          errors.push({
            nodeId: node.id,
            edgeId: edge.id,
            field: 'condition',
            message: 'Condition is required',
          });
        }
        if (!edge.to_node_id) {
          errors.push({
            nodeId: node.id,
            edgeId: edge.id,
            field: 'to_node_id',
            message: 'Target node is required',
          });
        } else if (!nodes.find((n) => n.id === edge.to_node_id)) {
          errors.push({
            nodeId: node.id,
            edgeId: edge.id,
            field: 'to_node_id',
            message: 'Target node does not exist',
          });
        }
      });
    });
    
    set({ validationErrors: errors });
    return errors.length === 0;
  },
  
  getReactFlowNodes: () => {
    const { nodes } = get();
    return nodes.map((node) => ({
      id: node.id,
      type: 'custom',
      position: node.position,
      data: {
        label: node.title,
        isStart: node.isStart,
        description: node.description,
      },
    }));
  },
  
  getReactFlowEdges: () => {
    const { nodes } = get();
    const edges: ReactFlowEdge[] = [];
    
    nodes.forEach((node) => {
      node.edges.forEach((edge) => {
        edges.push({
          id: edge.id,
          source: node.id,
          target: edge.to_node_id,
          label: edge.condition,
          type: 'smoothstep',
        });
      });
    });
    
    return edges;
  },
  
  updateNodePosition: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, position } : node
      ),
    }));
  },
}));
