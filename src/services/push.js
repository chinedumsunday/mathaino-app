import { Platform } from 'react-native';

// Native-only modules; web builds skip push entirely
let Notifications = null;
let Device = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');
  } catch (_) {}
}

const EAS_PROJECT_ID = 'a45184e1-a365-45ac-9707-980c9a3fd6a0';

// Show notifications while the app is in the foreground too
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Ask permission and return this device's Expo push token (or null).
 * Safe to call anywhere — resolves null on web, simulators, or denial.
 */
export async function registerForPush() {
  if (!Notifications || !Device?.isDevice) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
    return data;
  } catch (_) {
    return null;
  }
}

/**
 * Fires the callback with the notification's data payload when the user
 * taps a push notification.
 */
export function addNotificationTapListener(callback) {
  if (!Notifications) return { remove: () => {} };
  return Notifications.addNotificationResponseReceivedListener((response) => {
    callback(response.notification.request.content.data || {});
  });
}
