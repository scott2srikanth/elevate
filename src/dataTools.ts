import { translate, type Language } from "./i18n/translate";
import { Platform } from "react-native";
export async function exportFile(
  name: string,
  content: string,
  mime = "application/json",
) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const { File, Paths } = await import("expo-file-system");
  const Sharing = await import("expo-sharing");
  const file = new File(Paths.cache, name);
  file.write(content);
  if (await Sharing.isAvailableAsync())
    await Sharing.shareAsync(file.uri, { mimeType: mime });
  else throw new Error("Sharing is unavailable on this device.");
}
export function calendarReminder(hour: number, minute: number) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(hour).padStart(2, "0")}${String(minute).padStart(2, "0")}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Elevate//Coach//EN",
    "BEGIN:VEVENT",
    `UID:elevate-daily-${Date.now()}`,
    `DTSTAMP:${new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d+Z/, "Z")}`,
    `DTSTART:${stamp}`,
    "DURATION:PT5M",
    "RRULE:FREQ=DAILY",
    "SUMMARY:Your Elevate practice",
    "DESCRIPTION:Practice one skill and reflect on a real-world moment.",
    "BEGIN:VALARM",
    "TRIGGER:PT0M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Time for your Elevate practice",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
export async function setReminder(
  enabled: boolean,
  hour: number,
  minute: number,
  language: Language = "en",
) {
  if (Platform.OS === "web") {
    if (enabled)
      await exportFile(
        "elevate-reminder.ics",
        calendarReminder(hour, minute),
        "text/calendar",
      );
    return;
  }
  const Notifications = await import("expo-notifications");
  if (!enabled) {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("coaching", {
      name: "Coaching reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error(
      "Notification permission was not granted. Enable it in device settings.",
    );
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    identifier: "elevate-daily",
    content: {
      title: translate("A LITTLE PRACTICE. A LASTING DIFFERENCE.", language),
      body: translate(
        "Make time for one skill and one real-world reflection.",
        language,
      ),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: "coaching",
    },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: "elevate-weekly",
    content: {
      title: translate("Your weekly coaching review", language),
      body: translate(
        "Notice a win, name an obstacle, and choose your next commitment.",
        language,
      ),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour,
      minute,
      channelId: "coaching",
    },
  });
}
