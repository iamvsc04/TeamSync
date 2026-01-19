import { create } from "zustand";

// Minimal global store for UI state and ephemeral app data
export const useAppStore = create((set, get) => ({
  // UI
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  // Notifications
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  // Realtime flags
  lastRealtimeEventAt: null,
  bumpRealtime: () => set({ lastRealtimeEventAt: Date.now() }),
}));
