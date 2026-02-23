/**
 * AG-UI Chat Widget
 *
 * A chat interface for conversational flow building.
 */

import { useState, useRef, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAGUIChat } from "@/ag-ui/useAGUIChat";
import { useUIStore } from "@/store/uiStore";
import { Send, PanelLeftClose, Bot, User, Wrench, Loader2 } from "lucide-react";
import type { ChatMessage, ToolCall } from "@/ag-ui/types";

// ============================================================================
// Tool Call Display Component
// ============================================================================

const ToolCallDisplay = memo(({ toolCall }: { toolCall: ToolCall }) => {
  const statusIcon = {
    pending: <Loader2 className="w-3 h-3 animate-spin" />,
    running: <Loader2 className="w-3 h-3 animate-spin text-blue-500" />,
    completed: <span className="text-green-500">✓</span>,
    error: <span className="text-red-500">✗</span>,
  };

  return (
    <div className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1 my-1">
      <Wrench className="w-3 h-3 text-muted-foreground" />
      <span className="font-mono">{toolCall.name}</span>
      {statusIcon[toolCall.status]}
    </div>
  );
});

ToolCallDisplay.displayName = "ToolCallDisplay";

// ============================================================================
// Message Component
// ============================================================================

const MessageBubble = memo(({ message }: { message: ChatMessage }) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-lg px-3 py-2 text-sm ${
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          }`}
        >
          {/* Tool calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mb-2 space-y-1">
              {message.toolCalls.map((tc) => (
                <ToolCallDisplay key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}

          {/* Text content with markdown-like rendering */}
          <div className="whitespace-pre-wrap">
            {message.content.split("\n").map((line, i) => {
              // Bold text
              const boldParsed = line.replace(
                /\*\*(.+?)\*\*/g,
                "<strong>$1</strong>",
              );
              // Bullet points
              if (line.startsWith("• ")) {
                return (
                  <div key={i} className="ml-2">
                    <span dangerouslySetInnerHTML={{ __html: boldParsed }} />
                  </div>
                );
              }
              return (
                <span key={i}>
                  <span dangerouslySetInnerHTML={{ __html: boldParsed }} />
                  {i < message.content.split("\n").length - 1 && <br />}
                </span>
              );
            })}
          </div>

          {/* Streaming indicator */}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

// ============================================================================
// Main Chat Widget
// ============================================================================

export const ChatWidget = memo(() => {
  // Using OpenAI - make sure API key is from the correct project with credits
  const { messages, isLoading, sendMessage } = useAGUIChat({
    clientType: "openai",
  });
  const hideChatSidebar = useUIStore((state) => state.hideChatSidebar);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput("");
    await sendMessage(message);
    inputRef.current?.focus();
  };

  // Quick action buttons
  const quickActions = [
    { label: "Add node", action: "Add a new node" },
    { label: "3 nodes", action: "Add 3 nodes for a simple flow" },
    { label: "Help", action: "Help" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">AI Assistant</span>
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">AG-UI</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={hideChatSidebar}
          title="Hide sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 flex gap-2 flex-wrap">
          {quickActions.map((qa) => (
            <button
              key={qa.label}
              onClick={() => sendMessage(qa.action)}
              disabled={isLoading}
              className="text-xs px-2 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              {qa.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to build your flow..."
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
});

ChatWidget.displayName = "ChatWidget";
