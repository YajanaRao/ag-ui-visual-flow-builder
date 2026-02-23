/**
 * AG-UI Tool Definitions
 * 
 * These tools expose flow builder actions to the AG-UI agent.
 * The agent can call these tools to manipulate the flow.
 */

import type { ToolDefinition } from './types';
import { useFlowStore } from '@/store/flowStore';

/**
 * Creates tool definitions bound to the flow store.
 * Call this inside a React component or hook to get reactive tools.
 */
export function createFlowTools(): ToolDefinition[] {
  const store = useFlowStore.getState();

  return [
    {
      name: 'addNode',
      description: 'Add a new node to the flow canvas',
      parameters: [
        {
          name: 'title',
          type: 'string',
          description: 'The title/name of the node',
          required: false,
        },
        {
          name: 'description',
          type: 'string',
          description: 'A description for the node',
          required: false,
        },
      ],
      handler: (args) => {
        const { nodes } = useFlowStore.getState();
        
        // Calculate position
        let maxY = 0;
        nodes.forEach((node) => {
          if (node.position.y > maxY) maxY = node.position.y;
        });
        
        // Add the node
        store.addNode({ x: 0, y: 0 }); // Smart positioning in store
        
        // Get the newly created node
        const updatedNodes = useFlowStore.getState().nodes;
        const newNode = updatedNodes[updatedNodes.length - 1];
        
        // Update title and description if provided
        if (args.title || args.description) {
          store.updateNode(newNode.id, {
            title: (args.title as string) || newNode.title,
            description: (args.description as string) || newNode.description,
          });
        }
        
        return { 
          success: true, 
          nodeId: newNode.id,
          message: `Created node "${args.title || newNode.title}"` 
        };
      },
    },
    {
      name: 'deleteNode',
      description: 'Delete a node from the flow',
      parameters: [
        {
          name: 'nodeId',
          type: 'string',
          description: 'The ID of the node to delete',
          required: true,
        },
      ],
      handler: (args) => {
        const nodeId = args.nodeId as string;
        const { nodes } = useFlowStore.getState();
        
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          return { success: false, error: `Node "${nodeId}" not found` };
        }
        
        store.deleteNode(nodeId);
        return { success: true, message: `Deleted node "${nodeId}"` };
      },
    },
    {
      name: 'updateNode',
      description: 'Update a node\'s properties',
      parameters: [
        {
          name: 'nodeId',
          type: 'string',
          description: 'The ID of the node to update',
          required: true,
        },
        {
          name: 'title',
          type: 'string',
          description: 'New title for the node',
          required: false,
        },
        {
          name: 'description',
          type: 'string',
          description: 'New description for the node',
          required: false,
        },
      ],
      handler: (args) => {
        const nodeId = args.nodeId as string;
        const { nodes } = useFlowStore.getState();
        
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          return { success: false, error: `Node "${nodeId}" not found` };
        }
        
        const updates: Record<string, unknown> = {};
        if (args.title) updates.title = args.title;
        if (args.description) updates.description = args.description;
        
        store.updateNode(nodeId, updates);
        return { success: true, message: `Updated node "${nodeId}"` };
      },
    },
    {
      name: 'addEdge',
      description: 'Create a connection (edge) between two nodes',
      parameters: [
        {
          name: 'fromNodeId',
          type: 'string',
          description: 'The source node ID',
          required: true,
        },
        {
          name: 'toNodeId',
          type: 'string',
          description: 'The target node ID',
          required: true,
        },
        {
          name: 'condition',
          type: 'string',
          description: 'The condition text for the edge',
          required: false,
        },
      ],
      handler: (args) => {
        const fromNodeId = args.fromNodeId as string;
        const toNodeId = args.toNodeId as string;
        const condition = (args.condition as string) || 'continue';
        
        const { nodes } = useFlowStore.getState();
        
        const fromNode = nodes.find((n) => n.id === fromNodeId);
        const toNode = nodes.find((n) => n.id === toNodeId);
        
        if (!fromNode) {
          return { success: false, error: `Source node "${fromNodeId}" not found` };
        }
        if (!toNode) {
          return { success: false, error: `Target node "${toNodeId}" not found` };
        }
        
        store.addEdge(fromNodeId, {
          to_node_id: toNodeId,
          condition,
        });
        
        return { 
          success: true, 
          message: `Connected "${fromNodeId}" to "${toNodeId}"` 
        };
      },
    },
    {
      name: 'deleteEdge',
      description: 'Remove an edge between nodes',
      parameters: [
        {
          name: 'fromNodeId',
          type: 'string',
          description: 'The source node ID',
          required: true,
        },
        {
          name: 'edgeId',
          type: 'string',
          description: 'The ID of the edge to delete',
          required: true,
        },
      ],
      handler: (args) => {
        const fromNodeId = args.fromNodeId as string;
        const edgeId = args.edgeId as string;
        
        store.deleteEdge(fromNodeId, edgeId);
        return { success: true, message: `Deleted edge "${edgeId}"` };
      },
    },
    {
      name: 'setStartNode',
      description: 'Set a node as the start/entry point of the flow',
      parameters: [
        {
          name: 'nodeId',
          type: 'string',
          description: 'The ID of the node to set as start',
          required: true,
        },
      ],
      handler: (args) => {
        const nodeId = args.nodeId as string;
        const { nodes } = useFlowStore.getState();
        
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          return { success: false, error: `Node "${nodeId}" not found` };
        }
        
        store.setStartNode(nodeId);
        return { success: true, message: `Set "${nodeId}" as start node` };
      },
    },
    {
      name: 'getFlowState',
      description: 'Get the current state of the flow (all nodes and edges)',
      parameters: [],
      handler: () => {
        const { nodes, validationErrors } = useFlowStore.getState();
        return {
          success: true,
          nodeCount: nodes.length,
          nodes: nodes.map((n) => ({
            id: n.id,
            title: n.title,
            isStart: n.isStart,
            edgeCount: n.edges.length,
          })),
          hasErrors: validationErrors.length > 0,
          errors: validationErrors,
        };
      },
    },
  ];
}
