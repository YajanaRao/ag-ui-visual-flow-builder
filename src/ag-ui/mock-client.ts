/**
 * Mock AG-UI Client
 * 
 * This simulates AG-UI protocol responses for demo purposes.
 * Can be easily replaced with a real AG-UI backend client.
 */

import type {
  IAGUIClient,
  AGUIClientConfig,
  AGUIEvent,
  ToolDefinition,
} from './types';

// ============================================================================
// Intent Parser - Extracts user intent from natural language
// ============================================================================

interface ParsedIntent {
  action: 'add_node' | 'add_nodes' | 'delete_node' | 'connect_nodes' | 'set_start' | 'update_node' | 'clear_all' | 'help' | 'unknown';
  params: Record<string, unknown>;
}

function parseIntent(message: string): ParsedIntent {
  const lower = message.toLowerCase();

  // Add multiple nodes: "add 3 nodes", "create 5 nodes for login flow"
  const multiNodeMatch = lower.match(/(?:add|create)\s+(\d+)\s+nodes?(?:\s+(?:for|to|called|named)\s+(.+))?/);
  if (multiNodeMatch) {
    return {
      action: 'add_nodes',
      params: {
        count: parseInt(multiNodeMatch[1]),
        theme: multiNodeMatch[2]?.trim() || null,
      },
    };
  }

  // Add single node: "add a node", "create node called Welcome"
  if (lower.match(/(?:add|create)\s+(?:a\s+)?node/)) {
    const nameMatch = message.match(/(?:called|named|titled)\s+["']?([^"']+)["']?/i);
    return {
      action: 'add_node',
      params: { title: nameMatch?.[1] || null },
    };
  }

  // Delete node: "delete node 2", "remove the welcome node"
  if (lower.match(/(?:delete|remove)\s+(?:the\s+)?(?:node\s+)?/)) {
    const idMatch = message.match(/(?:node[_\s]?)?(\d+|[\w_]+)/i);
    return {
      action: 'delete_node',
      params: { nodeId: idMatch?.[1] || null },
    };
  }

  // Connect nodes: "connect node 1 to node 2", "link start to end with condition"
  if (lower.match(/(?:connect|link)\s+/)) {
    const connectMatch = message.match(/(?:connect|link)\s+(?:node[_\s]?)?(\w+)\s+(?:to|with)\s+(?:node[_\s]?)?(\w+)(?:\s+(?:with\s+)?(?:condition\s+)?["']?([^"']+)["']?)?/i);
    return {
      action: 'connect_nodes',
      params: {
        fromNodeId: connectMatch?.[1] || null,
        toNodeId: connectMatch?.[2] || null,
        condition: connectMatch?.[3] || null,
      },
    };
  }

  // Set start node: "set node 1 as start", "make welcome the start node"
  if (lower.match(/(?:set|make)\s+.+\s+(?:as\s+)?start/)) {
    const idMatch = message.match(/(?:node[_\s]?)?(\w+)\s+(?:as\s+)?(?:the\s+)?start/i);
    return {
      action: 'set_start',
      params: { nodeId: idMatch?.[1] || null },
    };
  }

  // Update node: "rename node 1 to Welcome", "change title of node 2"
  if (lower.match(/(?:rename|update|change|edit)\s+/)) {
    const updateMatch = message.match(/(?:node[_\s]?)?(\w+)\s+(?:to|title\s+to)\s+["']?([^"']+)["']?/i);
    return {
      action: 'update_node',
      params: {
        nodeId: updateMatch?.[1] || null,
        title: updateMatch?.[2] || null,
      },
    };
  }

  // Clear all: "clear all", "delete everything", "start over"
  if (lower.match(/(?:clear\s+all|delete\s+everything|start\s+over|reset)/)) {
    return { action: 'clear_all', params: {} };
  }

  // Help
  if (lower.match(/(?:help|what\s+can\s+you|how\s+do\s+i)/)) {
    return { action: 'help', params: {} };
  }

  return { action: 'unknown', params: {} };
}

// ============================================================================
// Response Generator - Creates themed node names
// ============================================================================

const flowThemes: Record<string, string[]> = {
  'login': ['Login Form', 'Validate Credentials', 'Auth Success', 'Auth Failed', 'Dashboard'],
  'authentication': ['Login Form', 'Validate Credentials', 'Auth Success', 'Auth Failed', 'Dashboard'],
  'onboarding': ['Welcome Screen', 'User Profile', 'Preferences', 'Tutorial', 'Complete'],
  'checkout': ['Cart Review', 'Shipping Info', 'Payment', 'Confirmation', 'Thank You'],
  'support': ['Welcome', 'Describe Issue', 'Check FAQ', 'Create Ticket', 'Resolution'],
  'survey': ['Introduction', 'Question 1', 'Question 2', 'Question 3', 'Thank You'],
  'default': ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
};

function getThemedNodeNames(theme: string | null, count: number): string[] {
  const normalizedTheme = theme?.toLowerCase() || 'default';
  
  // Find matching theme
  for (const [key, names] of Object.entries(flowThemes)) {
    if (normalizedTheme.includes(key)) {
      return names.slice(0, count);
    }
  }
  
  // If theme provided but not found, use it as prefix
  if (theme) {
    return Array.from({ length: count }, (_, i) => `${theme} - Step ${i + 1}`);
  }
  
  return flowThemes.default.slice(0, count);
}

// ============================================================================
// Mock Client Implementation
// ============================================================================

export class MockAGUIClient implements IAGUIClient {
  private tools: ToolDefinition[];
  private messageIdCounter = 0;
  private toolCallIdCounter = 0;

  constructor(config: AGUIClientConfig) {
    this.tools = config.tools;
  }

  getTools(): ToolDefinition[] {
    return this.tools;
  }

  private generateMessageId(): string {
    return `msg_${++this.messageIdCounter}`;
  }

  private generateToolCallId(): string {
    return `tool_${++this.toolCallIdCounter}`;
  }

  private findTool(name: string): ToolDefinition | undefined {
    return this.tools.find((t) => t.name === name);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async *sendMessage(message: string): AsyncGenerator<AGUIEvent> {
    const intent = parseIntent(message);
    const messageId = this.generateMessageId();

    // Start message
    yield {
      type: 'TEXT_MESSAGE_START',
      messageId,
      timestamp: Date.now(),
    };

    // Process based on intent
    switch (intent.action) {
      case 'add_node': {
        const title = intent.params.title as string | null;
        
        yield* this.streamText(messageId, title 
          ? `Creating a node called "${title}"...` 
          : 'Creating a new node...');
        
        await this.delay(300);
        
        // Tool call
        const toolCallId = this.generateToolCallId();
        const addNodeTool = this.findTool('addNode');
        
        if (addNodeTool) {
          yield { type: 'TOOL_CALL_START', toolCallId, toolName: 'addNode', timestamp: Date.now() };
          
          const args = { title: title || undefined };
          yield { type: 'TOOL_CALL_ARGS', toolCallId, args, timestamp: Date.now() };
          
          const result = await addNodeTool.handler(args);
          yield { type: 'TOOL_CALL_END', toolCallId, result, timestamp: Date.now() };
          
          await this.delay(200);
          yield* this.streamText(messageId, '\n\n✓ Node created successfully!');
        }
        break;
      }

      case 'add_nodes': {
        const count = Math.min(intent.params.count as number, 10); // Limit to 10
        const theme = intent.params.theme as string | null;
        const nodeNames = getThemedNodeNames(theme, count);
        
        yield* this.streamText(messageId, `Creating ${count} nodes${theme ? ` for ${theme} flow` : ''}...\n`);
        
        const addNodeTool = this.findTool('addNode');
        const addEdgeTool = this.findTool('addEdge');
        const createdNodeIds: string[] = [];
        
        if (addNodeTool) {
          for (let i = 0; i < count; i++) {
            await this.delay(400);
            
            const toolCallId = this.generateToolCallId();
            const title = nodeNames[i] || `Node ${i + 1}`;
            
            yield { type: 'TOOL_CALL_START', toolCallId, toolName: 'addNode', timestamp: Date.now() };
            yield { type: 'TOOL_CALL_ARGS', toolCallId, args: { title }, timestamp: Date.now() };
            
            const result = await addNodeTool.handler({ title }) as { nodeId?: string };
            createdNodeIds.push(result?.nodeId || `node_${i}`);
            
            yield { type: 'TOOL_CALL_END', toolCallId, result, timestamp: Date.now() };
            yield* this.streamText(messageId, `\n✓ Created "${title}"`);
          }
          
          // Connect nodes in sequence if we have addEdge tool
          if (addEdgeTool && createdNodeIds.length > 1) {
            await this.delay(300);
            yield* this.streamText(messageId, '\n\nConnecting nodes...');
            
            for (let i = 0; i < createdNodeIds.length - 1; i++) {
              await this.delay(200);
              
              const toolCallId = this.generateToolCallId();
              const args = {
                fromNodeId: createdNodeIds[i],
                toNodeId: createdNodeIds[i + 1],
                condition: 'continue',
              };
              
              yield { type: 'TOOL_CALL_START', toolCallId, toolName: 'addEdge', timestamp: Date.now() };
              yield { type: 'TOOL_CALL_ARGS', toolCallId, args, timestamp: Date.now() };
              
              const result = await addEdgeTool.handler(args);
              yield { type: 'TOOL_CALL_END', toolCallId, result, timestamp: Date.now() };
            }
            
            yield* this.streamText(messageId, '\n✓ Nodes connected!');
          }
          
          await this.delay(200);
          yield* this.streamText(messageId, `\n\nDone! Created ${count} nodes.`);
        }
        break;
      }

      case 'delete_node': {
        const nodeId = intent.params.nodeId as string | null;
        
        if (!nodeId) {
          yield* this.streamText(messageId, "I couldn't determine which node to delete. Please specify a node ID, like \"delete node_2\".");
          break;
        }
        
        yield* this.streamText(messageId, `Deleting node "${nodeId}"...`);
        
        const deleteNodeTool = this.findTool('deleteNode');
        if (deleteNodeTool) {
          await this.delay(300);
          
          const toolCallId = this.generateToolCallId();
          yield { type: 'TOOL_CALL_START', toolCallId, toolName: 'deleteNode', timestamp: Date.now() };
          yield { type: 'TOOL_CALL_ARGS', toolCallId, args: { nodeId }, timestamp: Date.now() };
          
          try {
            const result = await deleteNodeTool.handler({ nodeId });
            yield { type: 'TOOL_CALL_END', toolCallId, result, timestamp: Date.now() };
            yield* this.streamText(messageId, '\n\n✓ Node deleted!');
          } catch {
            yield* this.streamText(messageId, `\n\n✗ Could not find node "${nodeId}".`);
          }
        }
        break;
      }

      case 'connect_nodes': {
        const fromNodeId = intent.params.fromNodeId as string | null;
        const toNodeId = intent.params.toNodeId as string | null;
        const condition = intent.params.condition as string | null;
        
        if (!fromNodeId || !toNodeId) {
          yield* this.streamText(messageId, "Please specify both nodes to connect, like \"connect node_1 to node_2\".");
          break;
        }
        
        yield* this.streamText(messageId, `Connecting ${fromNodeId} to ${toNodeId}...`);
        
        const addEdgeTool = this.findTool('addEdge');
        if (addEdgeTool) {
          await this.delay(300);
          
          const toolCallId = this.generateToolCallId();
          const args = {
            fromNodeId: fromNodeId.includes('node') ? fromNodeId : `node_${fromNodeId}`,
            toNodeId: toNodeId.includes('node') ? toNodeId : `node_${toNodeId}`,
            condition: condition || 'continue',
          };
          
          yield { type: 'TOOL_CALL_START', toolCallId, toolName: 'addEdge', timestamp: Date.now() };
          yield { type: 'TOOL_CALL_ARGS', toolCallId, args, timestamp: Date.now() };
          
          const result = await addEdgeTool.handler(args);
          yield { type: 'TOOL_CALL_END', toolCallId, result, timestamp: Date.now() };
          
          yield* this.streamText(messageId, `\n\n✓ Connected with condition "${args.condition}"!`);
        }
        break;
      }

      case 'set_start': {
        const nodeId = intent.params.nodeId as string | null;
        
        if (!nodeId) {
          yield* this.streamText(messageId, "Please specify which node should be the start, like \"set node_2 as start\".");
          break;
        }
        
        yield* this.streamText(messageId, `Setting ${nodeId} as the start node...`);
        
        const setStartTool = this.findTool('setStartNode');
        if (setStartTool) {
          await this.delay(300);
          
          const toolCallId = this.generateToolCallId();
          const normalizedId = nodeId.includes('node') ? nodeId : `node_${nodeId}`;
          
          yield { type: 'TOOL_CALL_START', toolCallId, toolName: 'setStartNode', timestamp: Date.now() };
          yield { type: 'TOOL_CALL_ARGS', toolCallId, args: { nodeId: normalizedId }, timestamp: Date.now() };
          
          const result = await setStartTool.handler({ nodeId: normalizedId });
          yield { type: 'TOOL_CALL_END', toolCallId, result, timestamp: Date.now() };
          
          yield* this.streamText(messageId, '\n\n✓ Start node updated!');
        }
        break;
      }

      case 'help': {
        yield* this.streamText(messageId, `I can help you build your flow! Here's what I can do:

**Add Nodes**
• "Add a node" - creates a single node
• "Add a node called Welcome" - creates a named node
• "Add 3 nodes for login flow" - creates themed nodes

**Connect Nodes**
• "Connect node_1 to node_2"
• "Link node_1 to node_2 with condition 'user clicks yes'"

**Modify Nodes**
• "Set node_2 as start"
• "Delete node_3"

**Other**
• "Clear all" - removes all nodes

Try saying something like "Create 3 nodes for user onboarding"!`);
        break;
      }

      default: {
        yield* this.streamText(messageId, `I'm not sure how to help with that. Try:
• "Add a node called Welcome"
• "Add 3 nodes for checkout flow"
• "Connect node_1 to node_2"
• "Help" - to see all commands`);
      }
    }

    // End message
    yield {
      type: 'TEXT_MESSAGE_END',
      messageId,
      timestamp: Date.now(),
    };
  }

  private async *streamText(messageId: string, text: string): AsyncGenerator<AGUIEvent> {
    // Simulate streaming by yielding chunks
    const chunkSize = 10;
    for (let i = 0; i < text.length; i += chunkSize) {
      yield {
        type: 'TEXT_MESSAGE_CONTENT',
        messageId,
        content: text.slice(i, i + chunkSize),
        timestamp: Date.now(),
      };
      await this.delay(30); // Small delay between chunks for streaming effect
    }
  }

  dispose(): void {
    // Cleanup if needed
  }
}
