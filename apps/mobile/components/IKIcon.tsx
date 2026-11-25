import { useState } from "react";
import { Image } from "expo-image";
import { iconSrc } from "@/lib/api";
import { API_URL } from "@/lib/config";

/** Icon served from ImageKit; falls back to the web server's bundled copy if ImageKit can't serve it. */
export function IKIcon({ name, size = 24, tint }: { name: string; size?: number; tint?: string }) {
  const [fallback, setFallback] = useState(false);
  return (
    <Image
      source={{ uri: fallback ? `${API_URL}/icons/${name}.svg` : iconSrc(name) }}
      onError={() => setFallback(true)}
      style={{ width: size, height: size }}
      tintColor={tint}
      contentFit="contain"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
