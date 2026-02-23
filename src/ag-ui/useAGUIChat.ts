/**
 * AG-UI Chat Hook
 * 
 * React hook for managing AG-UI chat state and interactions.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, IAGUIClient, ToolCall } from './types';
import { createAGUIClient, type ClientType } from './client';
import { createFlowTools } from './tools';

interface UseAGUIChatOptions {
  clientType?: ClientType;
  apiKey?: string;
}

interface UseAGUIChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useAGUIChat(options: UseAGUIChatOptions = {}): UseAGUIChatReturn {
  // Determine client type - check for API keys in order of preference
  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  // Priority: explicit option > Gemini (free) > OpenAI > mock
  let effectiveClientType: ClientType = 'mock';
  let effectiveApiKey: string | undefined;
  
  if (options.clientType) {
    effectiveClientType = options.clientType;
    effectiveApiKey = options.apiKey;
  } else if (geminiApiKey) {
    // Prefer Gemini - it has a free tier
    effectiveClientType = 'gemini';
    effectiveApiKey = geminiApiKey;
  } else if (openaiApiKey) {
    effectiveClientType = 'openai';
    effectiveApiKey = openaiApiKey;
  }
  
  const isAIEnabled = effectiveClientType === 'openai' || effectiveClientType === 'gemini';

  const getWelcomeMessage = () => {
    if (effectiveClientType === 'openai') {
      return `Hi! I'm your AI flow building assistant powered by **GPT-4o-mini**. I can help you create complex flow diagrams!

Try asking me to:
• **"Create a software development lifecycle flow"**
• **"Build a user authentication flow"**  
• **"Add 5 nodes for an e-commerce checkout"**

What would you like to build?`;
    } else if (effectiveClientType === 'gemini') {
      return `Hi! I'm your AI flow building assistant powered by **Gemini**. I can help you create complex flow diagrams!

Try asking me to:
• **"Create a software development lifecycle flow"**
• **"Build a user authentication flow"**
• **"Add 5 nodes for an e-commerce checkout"**

What would you like to build?`;
    } else {
      return `Hi! I'm your flow building assistant (demo mode). I can help you:

• **Add nodes** - "Add 3 nodes for login flow"
• **Connect nodes** - "Connect node_1 to node_2"
• **Modify nodes** - "Set node_2 as start"

💡 *Add an OpenAI or Gemini API key to enable AI-powered flow generation!*`;
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const clientRef = useRef<IAGUIClient | null>(null);

  // Initialize client
  useEffect(() => {
    const tools = createFlowTools();
    clientRef.current = createAGUIClient({
      type: effectiveClientType,
      apiKey: effectiveApiKey,
      tools,
    });

    return () => {
      clientRef.current?.dispose();
    };
  }, [effectiveClientType, effectiveApiKey]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !clientRef.current) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Create placeholder for assistant message
    let assistantMessageId = '';
    let assistantContent = '';
    const toolCalls: ToolCall[] = [];

    try {
      // Process events from the client
      for await (const event of clientRef.current.sendMessage(content)) {
        switch (event.type) {
          case 'TEXT_MESSAGE_START':
            assistantMessageId = event.messageId;
            setMessages((prev) => [
              ...prev,
              {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                toolCalls: [],
                timestamp: Date.now(),
                isStreaming: true,
              },
            ]);
            break;

          case 'TEXT_MESSAGE_CONTENT':
            assistantContent += event.content;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: assistantContent }
                  : msg
              )
            );
            break;

          case 'TEXT_MESSAGE_END':
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );
            break;

          case 'TOOL_CALL_START':
            toolCalls.push({
              id: event.toolCallId,
              name: event.toolName,
              args: {},
              status: 'running',
            });
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, toolCalls: toolCalls.map(tc => ({ ...tc })) }
                  : msg
              )
            );
            break;

          case 'TOOL_CALL_ARGS': {
            const argIndex = toolCalls.findIndex((tc) => tc.id === event.toolCallId);
            if (argIndex !== -1) {
              toolCalls[argIndex] = { ...toolCalls[argIndex], args: event.args };
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, toolCalls: toolCalls.map(tc => ({ ...tc })) }
                    : msg
                )
              );
            }
            break;
          }

          case 'TOOL_CALL_END': {
            const endIndex = toolCalls.findIndex((tc) => tc.id === event.toolCallId);
            if (endIndex !== -1) {
              toolCalls[endIndex] = { 
                ...toolCalls[endIndex], 
                result: event.result, 
                status: 'completed' 
              };
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, toolCalls: toolCalls.map(tc => ({ ...tc })) }
                    : msg
                )
              );
            }
            break;
          }

          case 'ERROR':
            console.error('AG-UI Error:', event.error);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: `Error: ${event.error}`, isStreaming: false }
                  : msg
              )
            );
            break;
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    // Also reset chat history in the client
    clientRef.current?.dispose();
    const tools = createFlowTools();
    clientRef.current = createAGUIClient({
      type: effectiveClientType,
      apiKey: effectiveApiKey,
      tools,
    });

    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: isAIEnabled 
          ? `Chat cleared! I'm ready to help you build a new flow. What would you like to create?`
          : `Chat cleared! How can I help you build your flow?`,
        timestamp: Date.now(),
      },
    ]);
  }, [effectiveClientType, effectiveApiKey, isAIEnabled]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };
}
