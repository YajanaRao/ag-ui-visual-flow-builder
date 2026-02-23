import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useFlowStore } from '@/store/flowStore';
import { Star } from 'lucide-react';

export interface CustomNodeData {
  label: string;
  isStart: boolean;
  description?: string;
}

interface CustomNodeProps {
  id: string;
  data: CustomNodeData;
}

export const CustomNode = memo(({ id, data }: CustomNodeProps) => {
  const { selectNode, validationErrors } = useFlowStore();
  const hasError = validationErrors.some((e) => e.nodeId === id);

  return (
    <div
      onClick={() => selectNode(id)}
      data-testid={`flow-node-${id}`}
      className={`px-4 py-3 shadow-lg rounded-lg border-2 bg-white min-w-[150px] cursor-pointer transition-all ${
        hasError
          ? 'border-destructive'
          : 'border-border hover:border-primary'
      }`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="flex items-center gap-2">
        {data.isStart && (
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        )}
        <div className="font-medium text-sm" data-testid="node-label">{data.label}</div>
      </div>
      
      {data.description && (
        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
          {data.description}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
