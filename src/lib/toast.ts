/**
 * Lightweight Toast Notification Dispatcher
 */
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastEventDetail {
  id: string;
  message: string;
  type: ToastType;
}

export const toast = {
  success: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<ToastEventDetail>('app-toast', {
          detail: { id: Math.random().toString(), message, type: 'success' },
        })
      );
    }
  },
  error: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<ToastEventDetail>('app-toast', {
          detail: { id: Math.random().toString(), message, type: 'error' },
        })
      );
    }
  },
  info: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<ToastEventDetail>('app-toast', {
          detail: { id: Math.random().toString(), message, type: 'info' },
        })
      );
    }
  },
  warning: (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<ToastEventDetail>('app-toast', {
          detail: { id: Math.random().toString(), message, type: 'warning' },
        })
      );
    }
  },
};
