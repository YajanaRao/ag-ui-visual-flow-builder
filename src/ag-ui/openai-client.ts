/**
 * OpenAI AG-UI Client
 * 
 * Real LLM implementation using OpenAI's API with function calling.
 */

import OpenAI from 'openai';
import type {
  IAGUIClient,
  AGUIClientConfig,
  AGUIEvent,
  ToolDefinition,
} from './types';

// ============================================================================
// System Prompt for Flow Building Context
// ============================================================================

const SYSTEM_PROMPT = `You are an AI assistant specialized in building visual flow diagrams. You help users create workflow diagrams by adding nodes and connecting them with edges.

IMPORTANT GUIDELINES:
1. When users ask to create a flow (like "SDLC flow", "login flow", "checkout process"), break it down into logical steps and create nodes for each step.
2. Always connect nodes in a logical sequence using the addEdge tool.
3. The first node you create should typically be set as the start node using setStartNode.
4. Use descriptive titles for nodes that clearly indicate their purpose.
5. Add meaningful descriptions to nodes when appropriate.
6. When connecting nodes, provide meaningful condition labels (e.g., "on success", "if valid", "next step").
7. After creating all nodes, always connect them in sequence.

EXAMPLES OF GOOD RESPONSES:
- For "create SDLC flow": Create nodes for Requirements, Design, Development, Testing, Deployment, Maintenance and connect them sequentially.
- For "add 3 nodes for login": Create nodes like "Login Form", "Validate Credentials", "Dashboard" and connect them.

Always be helpful and explain what you're doing as you build the flow. Execute tool calls to actually build the flow, don't just describe what you would do.`;

// ============================================================================
// Type Conversion Helpers
// ============================================================================

function convertToolsToOpenAIFormat(tools: ToolDefinition[]): OpenAI.ChatCompletionTool[] {
  return tools.map((tool) => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.reduce((acc, param) => ({
          ...acc,
          [param.name]: {
            type: param.type,
            description: param.description,
          },
        }), {}),
        required: tool.parameters.filter((p) => p.required).map((p) => p.name),
      },
    },
  }));
}

// ============================================================================
// OpenAI Client Implementation
// ============================================================================

export class OpenAIAGUIClient implements IAGUIClient {
  private tools: ToolDefinition[];
  private openai: OpenAI;
  private chatHistory: OpenAI.ChatCompletionMessageParam[] = [];
  private messageIdCounter = 0;
  private toolCallIdCounter = 0;

  constructor(config: AGUIClientConfig) {
    this.tools = config.tools;
    
    const apiKey = config.apiKey || import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Set VITE_OPENAI_API_KEY in your .env file.');
    }

    // Use proxy in development to bypass CORS
    const isDev = import.meta.env.DEV;
    
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
      // In dev, use Vite proxy with full URL; in prod, use default
      baseURL: isDev ? 'http://localhost:5173/api/openai/v1' : undefined,
    });

    // Initialize with system message
    this.chatHistory.push({
      role: 'system',
      content: SYSTEM_PROMPT,
    });
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

  async *sendMessage(message: string): AsyncGenerator<AGUIEvent> {
    const messageId = this.generateMessageId();

    // Start message
    yield {
      type: 'TEXT_MESSAGE_START',
      messageId,
      timestamp: Date.now(),
    };

    try {
      // Add user message to history
      this.chatHistory.push({
        role: 'user',
        content: message,
      });

      // Call OpenAI API
      let response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and cheap, good for function calling
        messages: this.chatHistory,
        tools: convertToolsToOpenAIFormat(this.tools),
        tool_choice: 'auto',
      });

      let assistantMessage = response.choices[0].message;
      
      // Process response - may need multiple iterations for tool calls
      while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add assistant message with tool calls to history
        this.chatHistory.push(assistantMessage);

        // Stream any text content first
        if (assistantMessage.content) {
          const chunkSize = 20;
          for (let i = 0; i < assistantMessage.content.length; i += chunkSize) {
            yield {
              type: 'TEXT_MESSAGE_CONTENT',
              messageId,
              content: assistantMessage.content.slice(i, i + chunkSize),
              timestamp: Date.now(),
            };
            await new Promise((resolve) => setTimeout(resolve, 15));
          }
        }

        // Process each tool call
        const toolResults: OpenAI.ChatCompletionToolMessageParam[] = [];

        for (const toolCall of assistantMessage.tool_calls) {
          // Type guard for function tool calls
          if (toolCall.type !== 'function' || !('function' in toolCall)) {
            continue;
          }
          
          const functionCall = toolCall.function;
          const localToolCallId = this.generateToolCallId();
          const tool = this.findTool(functionCall.name);

          if (tool) {
            // Emit tool call start
            yield {
              type: 'TOOL_CALL_START',
              toolCallId: localToolCallId,
              toolName: functionCall.name,
              timestamp: Date.now(),
            };

            // Parse and emit args
            let args: Record<string, unknown> = {};
            try {
              args = JSON.parse(functionCall.arguments);
            } catch {
              args = {};
            }

            yield {
              type: 'TOOL_CALL_ARGS',
              toolCallId: localToolCallId,
              args,
              timestamp: Date.now(),
            };

            // Execute the tool
            let toolResult: unknown;
            try {
              toolResult = await tool.handler(args);
            } catch (error) {
              toolResult = { success: false, error: String(error) };
            }

            // Emit tool call end
            yield {
              type: 'TOOL_CALL_END',
              toolCallId: localToolCallId,
              result: toolResult,
              timestamp: Date.now(),
            };

            // Add to results for OpenAI
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          }
        }

        // Add tool results to history
        this.chatHistory.push(...toolResults);

        // Get next response from OpenAI
        response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: this.chatHistory,
          tools: convertToolsToOpenAIFormat(this.tools),
          tool_choice: 'auto',
        });

        assistantMessage = response.choices[0].message;
      }

      // Stream final text content
      if (assistantMessage.content) {
        // Add to history
        this.chatHistory.push({
          role: 'assistant',
          content: assistantMessage.content,
        });

        // Stream text
        const chunkSize = 20;
        for (let i = 0; i < assistantMessage.content.length; i += chunkSize) {
          yield {
            type: 'TEXT_MESSAGE_CONTENT',
            messageId,
            content: assistantMessage.content.slice(i, i + chunkSize),
            timestamp: Date.now(),
          };
          await new Promise((resolve) => setTimeout(resolve, 15));
        }
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      yield {
        type: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: Date.now(),
      };
    }

    // End message
    yield {
      type: 'TEXT_MESSAGE_END',
      messageId,
      timestamp: Date.now(),
    };
  }

  dispose(): void {
    // Clear chat history (keep system message)
    this.chatHistory = [this.chatHistory[0]];
  }
}
