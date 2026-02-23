/**
 * AG-UI Protocol Types
 * 
 * These types follow the AG-UI protocol specification for agent-to-UI communication.
 * Reference: https://docs.ag-ui.com/concepts/events
 */

// ============================================================================
// Core Event Types
// ============================================================================

export type AGUIEventType =
  | 'TEXT_MESSAGE_START'
  | 'TEXT_MESSAGE_CONTENT'
  | 'TEXT_MESSAGE_END'
  | 'TOOL_CALL_START'
  | 'TOOL_CALL_ARGS'
  | 'TOOL_CALL_END'
  | 'STATE_SYNC'
  | 'ERROR';

export interface BaseEvent {
  type: AGUIEventType;
  timestamp?: number;
}

export interface TextMessageStartEvent extends BaseEvent {
  type: 'TEXT_MESSAGE_START';
  messageId: string;
}

export interface TextMessageContentEvent extends BaseEvent {
  type: 'TEXT_MESSAGE_CONTENT';
  messageId: string;
  content: string;
}

export interface TextMessageEndEvent extends BaseEvent {
  type: 'TEXT_MESSAGE_END';
  messageId: string;
}

export interface ToolCallStartEvent extends BaseEvent {
  type: 'TOOL_CALL_START';
  toolCallId: string;
  toolName: string;
}

export interface ToolCallArgsEvent extends BaseEvent {
  type: 'TOOL_CALL_ARGS';
  toolCallId: string;
  args: Record<string, unknown>;
}

export interface ToolCallEndEvent extends BaseEvent {
  type: 'TOOL_CALL_END';
  toolCallId: string;
  result?: unknown;
}

export interface StateSyncEvent extends BaseEvent {
  type: 'STATE_SYNC';
  state: Record<string, unknown>;
}

export interface ErrorEvent extends BaseEvent {
  type: 'ERROR';
  error: string;
  code?: string;
}

export type AGUIEvent =
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent
  | StateSyncEvent
  | ErrorEvent;

// ============================================================================
// Tool Definitions
// ============================================================================

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  handler: (args: Record<string, unknown>) => unknown | Promise<unknown>;
}

// ============================================================================
// Message Types (for Chat UI)
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCalls?: ToolCall[];
  timestamp: number;
  isStreaming?: boolean;
}

// ============================================================================
// Client Configuration
// ============================================================================

export interface AGUIClientConfig {
  tools: ToolDefinition[];
  onEvent?: (event: AGUIEvent) => void;
  // For real backend integration
  endpoint?: string;
  apiKey?: string;
}

// ============================================================================
// Client Interface (Abstract - allows mock or real implementation)
// ============================================================================

export interface IAGUIClient {
  sendMessage(message: string): AsyncGenerator<AGUIEvent>;
  getTools(): ToolDefinition[];
  dispose(): void;
}
