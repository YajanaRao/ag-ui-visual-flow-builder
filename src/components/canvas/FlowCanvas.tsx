import { useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import { useFlowStore } from '@/store/flowStore';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import { useShallow } from 'zustand/react/shallow';

// Convert Zustand nodes to React Flow format
const toReactFlowNodes = (flowNodes: any[]) =>
  flowNodes.map((node) => ({
    id: node.id,
    type: 'custom',
    position: node.position,
    data: {
      label: node.title,
      isStart: node.isStart,
      description: node.description,
    },
  }));

// Convert Zustand edges to React Flow format
const toReactFlowEdges = (flowNodes: any[]) => {
  const result: any[] = [];
  flowNodes.forEach((node) => {
    node.edges.forEach((edge: any) => {
      result.push({
        id: edge.id,
        source: node.id,
        target: edge.to_node_id,
        label: edge.condition,
        type: 'custom',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#3b82f6',
        },
        animated: true,
      });
    });
  });
  return result;
};

export const FlowCanvas = () => {
  // Get store state and actions
  const { flowNodes, updateNodePosition, selectNode, addFlowEdge } = useFlowStore(
    useShallow((state) => ({
      flowNodes: state.nodes,
      updateNodePosition: state.updateNodePosition,
      selectNode: state.selectNode,
      addFlowEdge: state.addEdge,
    }))
  );

  // Use React Flow's internal state for smooth dragging
  const [nodes, setNodes, onNodesChange] = useNodesState(toReactFlowNodes(flowNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toReactFlowEdges(flowNodes));

  // Track if we're currently dragging to avoid sync loops
  const isDraggingRef = useRef(false);

  // Sync from Zustand store to React Flow state when store changes externally
  // (e.g., adding a node, editing properties, importing)
  useEffect(() => {
    // Only sync if not currently dragging to avoid interrupting the drag
    if (!isDraggingRef.current) {
      setNodes(toReactFlowNodes(flowNodes));
      setEdges(toReactFlowEdges(flowNodes));
    }
  }, [flowNodes, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  // Handle node changes - React Flow manages dragging internally
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      // Let React Flow handle all changes for smooth dragging
      onNodesChange(changes);

      // Track dragging state and sync to Zustand when drag ends
      changes.forEach((change) => {
        if (change.type === 'position') {
          if (change.dragging) {
            isDraggingRef.current = true;
          } else if (change.position) {
            // Drag ended - sync final position to Zustand store
            isDraggingRef.current = false;
            updateNodePosition(change.id, change.position);
          }
        }
      });
    },
    [onNodesChange, updateNodePosition]
  );

  const onConnect = useCallback(
    (connection: any) => {
      if (connection.source && connection.target) {
        addFlowEdge(connection.source, {
          to_node_id: connection.target,
          condition: 'New condition',
        });
      }
    },
    [addFlowEdge]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap nodeColor="#3b82f6" pannable zoomable />
      </ReactFlow>
    </div>
  );
};
