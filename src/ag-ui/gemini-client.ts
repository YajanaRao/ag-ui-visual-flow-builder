/**
 * Gemini AG-UI Client
 *
 * Real LLM implementation using Google's Gemini API with function calling.
 */

import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type Part,
  type FunctionDeclaration,
  type Schema,
} from "@google/generative-ai";
import type {
  IAGUIClient,
  AGUIClientConfig,
  AGUIEvent,
  ToolDefinition,
} from "./types";

// ============================================================================
// System Prompt for Flow Building Context
// ============================================================================

const SYSTEM_PROMPT = `You are an AI assistant specialized in building visual flow diagrams. You help users create workflow diagrams by adding nodes and connecting them with edges.

IMPORTANT GUIDELINES:
1. When users ask to create a flow (like "SDLC flow", "login flow", "checkout process"), break it down into logical steps and create nodes for each step.
2. Always connect nodes in a logical sequence using the addEdge tool.
3. The first node you create should typically be set as the start node.
4. Use descriptive titles for nodes that clearly indicate their purpose.
5. Add meaningful descriptions to nodes when appropriate.
6. When connecting nodes, provide meaningful condition labels (e.g., "on success", "if valid", "next step").

AVAILABLE TOOLS:
- addNode: Create a new node with title and optional description
- deleteNode: Remove a node by its ID
- updateNode: Update a node's title or description
- addEdge: Connect two nodes with an optional condition
- deleteEdge: Remove a connection between nodes
- setStartNode: Mark a node as the entry point of the flow
- getFlowState: Get current flow information

EXAMPLES OF GOOD RESPONSES:
- For "create SDLC flow": Create nodes for Requirements, Design, Development, Testing, Deployment, Maintenance and connect them sequentially.
- For "add 3 nodes for login": Create nodes like "Login Form", "Validate Credentials", "Dashboard" and connect them.
- For complex flows, explain what you're building as you go.

Always be helpful and explain what you're doing as you build the flow.`;

// ============================================================================
// Type Conversion Helpers
// ============================================================================

function convertParameterType(type: string): Schema {
  switch (type) {
    case "string":
      return { type: SchemaType.STRING };
    case "number":
      return { type: SchemaType.NUMBER };
    case "boolean":
      return { type: SchemaType.BOOLEAN };
    case "array":
      return { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } };
    default:
      return { type: SchemaType.STRING };
  }
}

function convertToolsToGeminiFormat(
  tools: ToolDefinition[],
): FunctionDeclaration[] {
  return tools.map((tool) => {
    const properties: { [k: string]: Schema } = {};

    for (const param of tool.parameters) {
      const schema = convertParameterType(param.type);
      properties[param.name] = {
        ...schema,
        description: param.description,
      } as Schema;
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties,
        required: tool.parameters.filter((p) => p.required).map((p) => p.name),
      },
    };
  });
}

// ============================================================================
// Gemini Client Implementation
// ============================================================================

export class GeminiAGUIClient implements IAGUIClient {
  private tools: ToolDefinition[];
  private genAI: GoogleGenerativeAI;
  private model;
  private chatHistory: Content[] = [];
  private messageIdCounter = 0;
  private toolCallIdCounter = 0;

  constructor(config: AGUIClientConfig) {
    this.tools = config.tools;

    const apiKey = config.apiKey || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Gemini API key is required. Set VITE_GEMINI_API_KEY in your .env file.",
      );
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    // Initialize the model with function calling
    // Using gemini-2.0-flash which is available and supports function calling
    this.model = this.genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
      tools: [
        {
          functionDeclarations: convertToolsToGeminiFormat(this.tools),
        },
      ],
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

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 5,
    baseDelay: number = 5000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const errorMessage = lastError.message || '';
        
        // Check if it's a rate limit error (429)
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
          const delay = baseDelay * Math.pow(2, i); // Exponential backoff: 5s, 10s, 20s, 40s, 80s
          console.log(`Rate limited. Retrying in ${delay/1000}s... (attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error; // Non-rate-limit error, throw immediately
        }
      }
    }
    
    throw lastError;
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
      const userContent: Content = {
        role: "user",
        parts: [{ text: message }],
      };
      this.chatHistory.push(userContent);

      // Create chat session with history
      const chat = this.model.startChat({
        history: this.chatHistory.slice(0, -1), // All but the last message
      });

      // Send message and get response (with retry for rate limits)
      const result = await this.retryWithBackoff(() => chat.sendMessage(message));
      const response = result.response;

      // Process the response
      let hasText = false;
      const functionCalls = response.functionCalls();

      // If there's text content, stream it
      const textContent = response.text();
      if (textContent) {
        hasText = true;
        // Stream text in chunks for better UX
        const chunkSize = 20;
        for (let i = 0; i < textContent.length; i += chunkSize) {
          yield {
            type: "TEXT_MESSAGE_CONTENT",
            messageId,
            content: textContent.slice(i, i + chunkSize),
            timestamp: Date.now(),
          };
          // Small delay for streaming effect
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
      }

      // Process function calls if any
      if (functionCalls && functionCalls.length > 0) {
        const functionResponses: Array<{ name: string; response: unknown }> =
          [];

        for (const functionCall of functionCalls) {
          const toolCallId = this.generateToolCallId();
          const tool = this.findTool(functionCall.name);

          if (tool) {
            // Emit tool call start
            yield {
              type: "TOOL_CALL_START",
              toolCallId,
              toolName: functionCall.name,
              timestamp: Date.now(),
            };

            // Emit tool call args
            const args = functionCall.args as Record<string, unknown>;
            yield {
              type: "TOOL_CALL_ARGS",
              toolCallId,
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
              type: "TOOL_CALL_END",
              toolCallId,
              result: toolResult,
              timestamp: Date.now(),
            };

            functionResponses.push({
              name: functionCall.name,
              response: toolResult,
            });
          }
        }

        // If we had function calls, send the results back to Gemini for a follow-up response
        if (functionResponses.length > 0) {
          // Add model response with function calls to history
          const modelParts: Part[] = functionCalls.map((fc) => ({
            functionCall: { name: fc.name, args: fc.args },
          }));
          this.chatHistory.push({
            role: "model",
            parts: modelParts,
          });

          // Add function responses to history
          const responseParts: Part[] = functionResponses.map((fr) => ({
            functionResponse: {
              name: fr.name,
              response: fr.response as object,
            },
          }));
          this.chatHistory.push({
            role: "user",
            parts: responseParts,
          });

          // Get follow-up response (with retry for rate limits)
          const followUpChat = this.model.startChat({
            history: this.chatHistory.slice(0, -1),
          });

          const followUpResult = await this.retryWithBackoff(() => 
            followUpChat.sendMessage(responseParts)
          );

          const followUpText = followUpResult.response.text();
          if (followUpText) {
            // Add newline if we had previous content
            if (hasText) {
              yield {
                type: "TEXT_MESSAGE_CONTENT",
                messageId,
                content: "\n\n",
                timestamp: Date.now(),
              };
            }

            // Stream follow-up text
            const chunkSize = 20;
            for (let i = 0; i < followUpText.length; i += chunkSize) {
              yield {
                type: "TEXT_MESSAGE_CONTENT",
                messageId,
                content: followUpText.slice(i, i + chunkSize),
                timestamp: Date.now(),
              };
              await new Promise((resolve) => setTimeout(resolve, 20));
            }

            // Add follow-up to history
            this.chatHistory.push({
              role: "model",
              parts: [{ text: followUpText }],
            });
          }

          // Check for more function calls in follow-up (recursive handling)
          const moreFunctionCalls = followUpResult.response.functionCalls();
          if (moreFunctionCalls && moreFunctionCalls.length > 0) {
            // Process additional function calls
            for (const functionCall of moreFunctionCalls) {
              const toolCallId = this.generateToolCallId();
              const tool = this.findTool(functionCall.name);

              if (tool) {
                yield {
                  type: "TOOL_CALL_START",
                  toolCallId,
                  toolName: functionCall.name,
                  timestamp: Date.now(),
                };

                const args = functionCall.args as Record<string, unknown>;
                yield {
                  type: "TOOL_CALL_ARGS",
                  toolCallId,
                  args,
                  timestamp: Date.now(),
                };

                let toolResult: unknown;
                try {
                  toolResult = await tool.handler(args);
                } catch (error) {
                  toolResult = { success: false, error: String(error) };
                }

                yield {
                  type: "TOOL_CALL_END",
                  toolCallId,
                  result: toolResult,
                  timestamp: Date.now(),
                };
              }
            }
          }
        }
      } else if (textContent) {
        // Add model response to history (text only)
        this.chatHistory.push({
          role: "model",
          parts: [{ text: textContent }],
        });
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      yield {
        type: "ERROR",
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        timestamp: Date.now(),
      };
    }

    // End message
    yield {
      type: "TEXT_MESSAGE_END",
      messageId,
      timestamp: Date.now(),
    };
  }

  dispose(): void {
    // Clear chat history
    this.chatHistory = [];
  }
}
