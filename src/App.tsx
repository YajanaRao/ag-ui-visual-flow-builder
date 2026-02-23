import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from './components/canvas/FlowCanvas';
import { NodeSidebar } from './components/sidebar/NodeSidebar';
import { ChatSidebar } from './components/sidebar/ChatSidebar';
import { JsonPreview } from './components/preview/JsonPreview';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { useFlowStore } from './store/flowStore';
import { useUIStore } from './store/uiStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Plus, Upload, AlertCircle, PanelLeftOpen } from 'lucide-react';
import { useRef } from 'react';

function App() {
  const { addNode, importFlow, validationErrors } = useFlowStore();
  const { isChatSidebarVisible, showChatSidebar } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const handleAddNode = () => {
    // Pass 0,0 to trigger smart positioning in store
    addNode({ x: 0, y: 0 });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const result = importFlow(content);
        if (!result.success) {
          alert(`Import failed: ${result.error}`);
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const globalErrors = validationErrors.filter((e) => !e.nodeId);

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="border-b bg-background p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Visual Flow Builder</h1>
          {globalErrors.length > 0 && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{globalErrors[0].message}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddNode} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import JSON
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - AI Assistant */}
        <ChatSidebar />
        
        {/* Center - Canvas */}
        <div className="flex-1 relative">
          {/* Show sidebar toggle button when sidebar is hidden */}
          {!isChatSidebarVisible && (
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 left-4 z-10 h-9 w-9 shadow-md"
              onClick={showChatSidebar}
              title="Show AI Assistant"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </Button>
          )}
          <ReactFlowProvider>
            <FlowCanvas />
          </ReactFlowProvider>
        </div>
        
        {/* Right Sidebar - Node Properties */}
        <NodeSidebar />
      </div>

      {/* JSON Preview */}
      <JsonPreview />
    </div>
  );
}

export default App
