import Constants from "expo-constants";

/**
 * Base URL of the Next.js server. Set EXPO_PUBLIC_API_URL, or in development we guess it from the
 * Expo dev-server host (same machine, port 3000), so phones on the same Wi-Fi work out of the box.
 */
function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:3000` : "http://localhost:3000";
}

export const API_URL = resolveApiUrl();
export const IK_ENDPOINT = process.env.EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";
