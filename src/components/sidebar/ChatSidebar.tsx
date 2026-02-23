/**
 * Chat Sidebar (Left Side)
 * 
 * Contains the AG-UI AI Assistant for conversational flow building.
 */

import { memo } from 'react';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { useUIStore } from '@/store/uiStore';

export const ChatSidebar = memo(() => {
  const isChatSidebarVisible = useUIStore((state) => state.isChatSidebarVisible);

  if (!isChatSidebarVisible) {
    return null;
  }

  return (
    <div className="w-80 border-r bg-background flex flex-col h-full">
      <ChatWidget />
    </div>
  );
});

ChatSidebar.displayName = 'ChatSidebar';
