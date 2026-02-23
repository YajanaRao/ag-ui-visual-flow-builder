import { useEffect } from 'react';
import { useFlowStore } from '@/store/flowStore';

export const useKeyboardShortcuts = () => {
  const { selectedNodeId, deleteNode } = useFlowStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Delete key or Backspace
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId) {
        // Prevent default behavior if not in an input field
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          deleteNode(selectedNodeId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, deleteNode]);
};
