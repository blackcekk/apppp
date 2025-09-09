import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { NotificationType } from '@/types/alert';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private hasNotificationPermission = false;
  private hasAlarmPermission = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize() {
    await this.checkPermissions();
  }

  private async checkPermissions() {
    if (Platform.OS === 'web') {
      // Web doesn't support native notifications in the same way
      this.hasNotificationPermission = false;
      this.hasAlarmPermission = false;
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    this.hasNotificationPermission = existingStatus === 'granted';
    
    // For alarms, we'll use the same notification permission
    // In a real app, you might want to use a separate alarm permission
    this.hasAlarmPermission = existingStatus === 'granted';
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return false;
    }

    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission denied');
      return false;
    }

    this.hasNotificationPermission = true;
    this.hasAlarmPermission = true; // Using same permission for simplicity
    return true;
  }

  async requestAlarmPermission(): Promise<boolean> {
    // For this implementation, we'll use the same notification permission
    // In a real app, you might want to implement platform-specific alarm permissions
    return await this.requestNotificationPermission();
  }

  getPermissionStatus(type: NotificationType): { hasPermission: boolean; canRequest: boolean } {
    switch (type) {
      case 'app':
        return {
          hasPermission: this.hasNotificationPermission,
          canRequest: !this.hasNotificationPermission && Platform.OS !== 'web'
        };
      case 'alarm':
        return {
          hasPermission: this.hasAlarmPermission,
          canRequest: !this.hasAlarmPermission && Platform.OS !== 'web'
        };
      case 'both':
        return {
          hasPermission: this.hasNotificationPermission && this.hasAlarmPermission,
          canRequest: (!this.hasNotificationPermission || !this.hasAlarmPermission) && Platform.OS !== 'web'
        };
      default:
        return { hasPermission: false, canRequest: false };
    }
  }

  async scheduleNotification(title: string, body: string, type: NotificationType) {
    if (Platform.OS === 'web') {
      // For web, we can show a browser notification if permission is granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }

    const permissionStatus = this.getPermissionStatus(type);
    if (!permissionStatus.hasPermission) {
      console.log('No permission for notification type:', type);
      return;
    }

    try {
      if (type === 'app' || type === 'both') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
          },
          trigger: null, // Show immediately
        });
      }

      if (type === 'alarm' || type === 'both') {
        // For alarm-style notifications, we'll use a more prominent notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🚨 ${title}`,
            body,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            vibrate: [0, 250, 250, 250],
          },
          trigger: null, // Show immediately
        });
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  async triggerPriceAlert(symbol: string, currentPrice: number, targetPrice: number, type: 'above' | 'below', notificationType: NotificationType) {
    const direction = type === 'above' ? 'above' : 'below';
    const title = `Price Alert: ${symbol}`;
    const body = `${symbol} is now ${direction} your target price of $${targetPrice.toFixed(2)} (Current: $${currentPrice.toFixed(2)})`;
    
    await this.scheduleNotification(title, body, notificationType);
  }
}

export const notificationService = NotificationService.getInstance();