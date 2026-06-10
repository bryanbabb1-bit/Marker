// Push-notification helpers. Must be SAFE on a build that lacks the
// expo-notifications native module (e.g. the pre-notifications dev client):
// requiring 'expo-notifications' there eagerly loads ExpoPushTokenManager and
// throws, which expo reports to the dev overlay even when caught. So we PROBE
// for the native module first and no-op when it's absent — no require, no error.

function notificationsAvailable(): boolean {
  try {
    const core = require('expo-modules-core');
    if (typeof core.requireOptionalNativeModule !== 'function') return false;
    return !!core.requireOptionalNativeModule('ExpoPushTokenManager');
  } catch {
    return false;
  }
}

export function configureNotifications() {
  if (!notificationsAvailable()) return;
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch { /* ignore */ }
}

// Ask permission and return the Expo push token, or null when unsupported/denied.
export async function registerForPush(): Promise<string | null> {
  if (!notificationsAvailable()) return null;
  try {
    const Notifications = require('expo-notifications');
    const Constants = require('expo-constants').default ?? require('expo-constants');

    const current = await Notifications.getPermissionsAsync();
    let status = current.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return null;

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return token?.data ?? null;
  } catch {
    return null;
  }
}
