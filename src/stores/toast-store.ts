import { create } from "zustand";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id">) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: ({ type, message, duration = 3000 }) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

export const toast = {
  success: (message: string, duration = 3000) => {
    useToastStore.getState().addToast({ type: "success", message, duration });
  },
  error: (message: string, duration = 4000) => {
    useToastStore.getState().addToast({ type: "error", message, duration });
  },
  info: (message: string, duration = 3000) => {
    useToastStore.getState().addToast({ type: "info", message, duration });
  },
};
