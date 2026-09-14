const DEVICE_ID_KEY = "starter_device_id";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export function getWebDevicePayload() {
  return {
    deviceId: getOrCreateDeviceId(),
    deviceInfo: {
      platform: "web" as const,
      model: typeof navigator !== "undefined" ? navigator.platform : undefined,
      osVersion:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      appVersion: "web",
    },
  };
}
