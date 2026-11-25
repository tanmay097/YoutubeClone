import * as SecureStore from "expo-secure-store";
import { createApiClient, ikIcon, ikUrl } from "@vidora/shared";
import { API_URL, IK_ENDPOINT } from "./config";

const TOKEN_KEY = "vidora_token";
let memoryToken: string | null = null;

export const tokenStore = {
  async load() {
    memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
    return memoryToken;
  },
  async save(token: string) {
    memoryToken = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear() {
    memoryToken = null;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
  get: () => memoryToken,
};

export const api = createApiClient({ baseUrl: API_URL, getToken: () => memoryToken });

/** ImageKit-hosted icon, falling back to the web server's copy until ImageKit is configured. */
export const iconSrc = (name: string) => (IK_ENDPOINT ? ikIcon(IK_ENDPOINT, name) : `${API_URL}/icons/${name}.svg`);
export const imageSrc = (src: string, tr?: string) => (IK_ENDPOINT && src ? ikUrl(IK_ENDPOINT, src, tr) : src);
