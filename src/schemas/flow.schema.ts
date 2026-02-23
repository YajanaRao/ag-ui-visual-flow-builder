import { z } from 'zod';

// Edge schema - simpler version without AG-UI metadata
export const EdgeSchema = z.object({
  id: z.string(),
  to_node_id: z.string().min(1, "Target node is required"),
  condition: z.string().min(1, "Condition is required"),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

// Node schema
export const NodeSchema = z.object({
  id: z.string().min(1, "Node ID is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  isStart: z.boolean().default(false),
  edges: z.array(EdgeSchema).default([]),
});

// Full flow schema
export const FlowSchema = z.object({
  nodes: z.array(NodeSchema),
});

// Types derived from schemas
export type Edge = z.infer<typeof EdgeSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Flow = z.infer<typeof FlowSchema>;

// Validation error type
export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  field: string;
  message: string;
}
