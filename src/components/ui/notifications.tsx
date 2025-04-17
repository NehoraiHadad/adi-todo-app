'use client';

import { toast as hotToast } from 'react-hot-toast';
import { toast as shadcnToast } from '@/components/ui/use-toast';

type NotificationType = 'success' | 'error' | 'loading' | 'info';

interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  id?: string;
  accessibilityMode?: boolean;
}

/**
 * Standard message templates for different actions to ensure consistency
 */
export const notificationMessages = {
  // Success messages
  create: {
    success: (item: string) => `יצירת ${item} הושלמה`,
    title: 'נוצר בהצלחה! 🎉'
  },
  update: {
    success: (item: string) => `עדכון ${item} הושלם`,
    title: 'עודכן בהצלחה! 👍'
  },
  delete: {
    success: (item: string) => `מחיקת ${item} הושלמה`,
    title: 'נמחק בהצלחה! 🗑️'
  },
  save: {
    success: (item: string) => `שמירת ${item} הושלמה`,
    title: 'נשמר בהצלחה! 💾'
  },
  load: {
    success: (item: string) => `טעינת ${item} הושלמה`,
    title: 'נטען בהצלחה! 🚀'
  },
  // Loading messages
  loading: {
    create: (item: string) => `יוצר ${item}...`,
    update: (item: string) => `מעדכן ${item}...`,
    delete: (item: string) => `מוחק ${item}...`,
    save: (item: string) => `שומר ${item}...`,
    load: (item: string) => `טוען ${item}...`
  },
  // Error messages
  error: {
    create: (item: string) => `אופס! לא הצלחנו ליצור את ${item}`,
    update: (item: string) => `אופס! משהו השתבש בעדכון ${item}`,
    delete: (item: string) => `אופס! לא הצלחנו למחוק את ${item}`,
    save: (item: string) => `אופס! לא הצלחנו לשמור את ${item}`,
    load: (item: string) => `אופס! היתה בעיה בטעינת ${item}`
  }
};

/**
 * Helper function to get the default title based on notification type
 */
const getDefaultTitle = (type: NotificationType): string => {
  switch (type) {
    case 'success': return 'הצלחה! 🎉';
    case 'error': return 'אופס! 😕';
    case 'loading': return 'טוען... ⏳';
    case 'info': return 'לתשומת לבך 💡';
    default: return '';
  }
};

/**
 * Standard notification helper to ensure consistent notifications across the app
 */
const showNotification = (
  message: string,
  type: NotificationType = 'info',
  options: NotificationOptions = {}
) => {
  // Use shadcn toast as the primary notification system
  if (type === 'loading') {
    return hotToast.loading(message, { id: options.id });
  } else {
    // Use shadcn toast for other notification types
    return shadcnToast({
      title: options.title || getDefaultTitle(type),
      description: message || options.description,
      variant: type === 'error' ? 'destructive' : type === 'success' ? 'success' : 'default',
    });
  }
};

// Create specific helper functions for different notification types
export const notifications = {
  success: (message: string, options?: NotificationOptions) => 
    showNotification(message, 'success', options),
  
  error: (message: string, options?: NotificationOptions) => 
    showNotification(message, 'error', options),
  
  info: (message: string, options?: NotificationOptions) => 
    showNotification(message, 'info', options),
  
  loading: (message: string, options?: NotificationOptions): string => {
    const result = showNotification(message, 'loading', options);
    // For loading toasts, extract the ID string
    return typeof result === 'string' ? result : result.id;
  },
  
  // Special method to dismiss a loading toast
  dismiss: (id?: string) => {
    if (id) {
      hotToast.dismiss(id);
    } else {
      hotToast.dismiss();
    }
  }
}; 