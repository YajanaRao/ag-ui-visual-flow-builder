/**
 * AG-UI Client Factory
 * 
 * This provides a clean interface to create AG-UI clients.
 * Swap from mock to real implementation by changing the factory function.
 */

import type { IAGUIClient, AGUIClientConfig } from './types';
import { MockAGUIClient } from './mock-client';
import { GeminiAGUIClient } from './gemini-client';
import { OpenAIAGUIClient } from './openai-client';

// ============================================================================
// Client Factory
// ============================================================================

export type ClientType = 'mock' | 'gemini' | 'openai' | 'copilotkit' | 'custom';

interface CreateClientOptions extends AGUIClientConfig {
  type?: ClientType;
}

/**
 * Creates an AG-UI client based on the specified type.
 * 
 * Usage:
 * ```typescript
 * // Mock client (default - no API key)
 * const client = createAGUIClient({ tools: [...] });
 * 
 * // Gemini client (with API key)
 * const client = createAGUIClient({ 
 *   type: 'gemini',
 *   apiKey: 'your-api-key', // or set VITE_GEMINI_API_KEY env var
 *   tools: [...] 
 * });
 * ```
 */
export function createAGUIClient(options: CreateClientOptions): IAGUIClient {
  const { type = 'mock', ...config } = options;

  switch (type) {
    case 'mock':
      return new MockAGUIClient(config);
    
    case 'gemini':
      try {
        return new GeminiAGUIClient(config);
      } catch (error) {
        console.warn('Failed to initialize Gemini client:', error);
        console.warn('Falling back to mock client');
        return new MockAGUIClient(config);
      }
    
    case 'openai':
      try {
        return new OpenAIAGUIClient(config);
      } catch (error) {
        console.warn('Failed to initialize OpenAI client:', error);
        console.warn('Falling back to mock client');
        return new MockAGUIClient(config);
      }
    
    case 'copilotkit':
      // TODO: Implement CopilotKit integration
      console.warn('CopilotKit client not implemented, falling back to mock');
      return new MockAGUIClient(config);
    
    case 'custom':
      // TODO: Implement custom backend integration
      console.warn('Custom client not implemented, falling back to mock');
      return new MockAGUIClient(config);
    
    default:
      return new MockAGUIClient(config);
  }
}

// ============================================================================
// Re-exports
// ============================================================================

export * from './types';
export { MockAGUIClient } from './mock-client';
export { GeminiAGUIClient } from './gemini-client';
export { OpenAIAGUIClient } from './openai-client';
