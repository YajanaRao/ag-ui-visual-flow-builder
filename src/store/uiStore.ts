import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isChatSidebarVisible: boolean;
  
  // Actions
  toggleChatSidebar: () => void;
  showChatSidebar: () => void;
  hideChatSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isChatSidebarVisible: true,
      
      toggleChatSidebar: () => 
        set((state) => ({ isChatSidebarVisible: !state.isChatSidebarVisible })),
      
      showChatSidebar: () => 
        set({ isChatSidebarVisible: true }),
      
      hideChatSidebar: () => 
        set({ isChatSidebarVisible: false }),
    }),
    {
      name: 'ui-store',
    }
  )
);
