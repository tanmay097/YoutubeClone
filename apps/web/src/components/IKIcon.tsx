import { iconSrc } from "@/lib/client";
import { FallbackImg } from "./FallbackImg";

/** Icon served from ImageKit; falls back to the bundled copy in /public/icons if ImageKit can't serve it. */
export function IKIcon({ name, size = 24, className = "", label }: { name: string; size?: number; className?: string; label?: string }) {
  return (
    <FallbackImg
      sources={[iconSrc(name), `/icons/${name}.svg`]}
      width={size}
      height={size}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      className={`shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}
