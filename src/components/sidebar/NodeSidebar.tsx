import { useEffect, useState, memo } from 'react';
import { useFlowStore } from '@/store/flowStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Star } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

export const NodeSidebar = memo(() => {
  const {
    nodes,
    selectedNodeId,
    updateNode,
    deleteNode,
    setStartNode,
    addEdge,
    updateEdge,
    deleteEdge,
    validationErrors,
  } = useFlowStore(
    useShallow((state) => ({
      nodes: state.nodes,
      selectedNodeId: state.selectedNodeId,
      updateNode: state.updateNode,
      deleteNode: state.deleteNode,
      setStartNode: state.setStartNode,
      addEdge: state.addEdge,
      updateEdge: state.updateEdge,
      deleteEdge: state.deleteEdge,
      validationErrors: state.validationErrors,
    }))
  );

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const [nodeId, setNodeId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (selectedNode) {
      setNodeId(selectedNode.id);
      setTitle(selectedNode.title);
      setDescription(selectedNode.description || '');
    } else {
      setNodeId('');
      setTitle('');
      setDescription('');
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
        <p className="text-sm text-muted-foreground text-center mt-8">
          Select a node to edit its properties
        </p>
      </div>
    );
  }

  const nodeErrors = validationErrors.filter((e) => e.nodeId === selectedNode.id);

  const handleUpdate = () => {
    updateNode(selectedNode.id, {
      id: nodeId,
      title,
      description,
    });
  };

  const availableTargets = nodes.filter((n) => n.id !== selectedNode.id);

  return (
    <div className="w-80 border-l bg-background p-4 overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Node Properties</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteNode(selectedNode.id)}
            className="text-destructive hover:text-destructive"
            data-testid="delete-node-button"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {nodeErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive rounded-md p-3">
            <p className="text-sm text-destructive font-medium">Validation Errors:</p>
            <ul className="text-sm text-destructive mt-1 space-y-1">
              {nodeErrors.map((error, idx) => (
                <li key={idx}>• {error.message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="nodeId">Node ID *</Label>
          <Input
            id="nodeId"
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            onBlur={handleUpdate}
            placeholder="unique_node_id"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdate}
            placeholder="Node title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleUpdate}
            placeholder="Additional details about this node"
            rows={3}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={selectedNode.isStart ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStartNode(selectedNode.id)}
            className="flex items-center gap-2"
          >
            <Star className="w-3 h-3" />
            {selectedNode.isStart ? 'Start Node' : 'Set as Start'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Outgoing Edges</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                data-testid="add-edge-button"
                onClick={() =>
                  addEdge(selectedNode.id, {
                    to_node_id: '',
                    condition: '',
                  })
                }
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNode.edges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No outgoing edges</p>
            ) : (
              selectedNode.edges.map((edge) => {
                const edgeErrors = validationErrors.filter(
                  (e) => e.nodeId === selectedNode.id && e.edgeId === edge.id
                );
                
                return (
                  <div key={edge.id} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
                    {edgeErrors.length > 0 && (
                      <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                        {edgeErrors.map((e) => e.message).join(', ')}
                      </div>
                    )}
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Target Node</Label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                        value={edge.to_node_id}
                        onChange={(e) =>
                          updateEdge(selectedNode.id, edge.id, {
                            to_node_id: e.target.value,
                          })
                        }
                      >
                        <option value="">Select target...</option>
                        {availableTargets.map((node) => (
                          <option key={node.id} value={node.id}>
                            {node.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Condition</Label>
                      <Input
                        value={edge.condition}
                        onChange={(e) =>
                          updateEdge(selectedNode.id, edge.id, {
                            condition: e.target.value,
                          })
                        }
                        placeholder="if user clicks yes"
                        className="h-9 text-sm"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteEdge(selectedNode.id, edge.id)}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Remove Edge
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

NodeSidebar.displayName = 'NodeSidebar';
