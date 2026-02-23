import { useFlowStore } from '@/store/flowStore';
import { Button } from '@/components/ui/button';
import { Copy, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useMemo, memo } from 'react';
import { useShallow } from 'zustand/react/shallow';

// Syntax highlighting function for JSON
const syntaxHighlight = (json: string) => {
  return json.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-slate-300';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-400'; // Key
        } else {
          cls = 'text-green-400'; // String value
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-400'; // Boolean
      } else if (/null/.test(match)) {
        cls = 'text-red-400'; // Null
      } else {
        cls = 'text-orange-400'; // Number
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
};

export const JsonPreview = memo(() => {
  // Only subscribe to nodes, not the entire store
  const nodes = useFlowStore(useShallow((state) => state.nodes));
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Memoize JSON stringification
  const json = useMemo(() => JSON.stringify({ nodes }, null, 2), [nodes]);
  
  // Memoize syntax highlighted HTML
  const highlightedJson = useMemo(() => syntaxHighlight(json), [json]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border-t bg-muted/30">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-semibold">JSON Preview</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-3 h-3 mr-2" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="w-3 h-3 mr-2" />
            Download
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 max-h-96 overflow-y-auto">
          <pre className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs overflow-x-auto">
            <code dangerouslySetInnerHTML={{ __html: highlightedJson }} />
          </pre>
        </div>
      )}
    </div>
  );
});

JsonPreview.displayName = 'JsonPreview';
