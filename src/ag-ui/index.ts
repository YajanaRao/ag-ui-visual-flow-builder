/**
 * AG-UI Module
 * 
 * Agentic UI protocol implementation for the flow builder.
 * 
 * To switch from mock to real backend:
 * 1. Implement a new client in `real-client.ts` that implements `IAGUIClient`
 * 2. Update `client.ts` factory to support the new client type
 * 3. Pass the client type to `useAGUIChat({ clientType: 'your-client' })`
 */

export * from './types';
export * from './client';
export * from './tools';
export * from './useAGUIChat';
