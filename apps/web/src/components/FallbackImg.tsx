"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & { sources: string[]; alt: string };

/**
 * <img> that tries each source in order until one loads. Also catches failures that happened
 * before hydration, since server-rendered images can error before React attaches onError.
 */
export function FallbackImg({ sources, alt, ...props }: Props) {
  const key = sources.join("|");
  const [state, setState] = useState({ key, index: 0 });
  const index = state.key === key ? state.index : 0;
  const ref = useRef<HTMLImageElement>(null);

  const advance = () => setState((s) => ({ key, index: Math.min((s.key === key ? s.index : 0) + 1, sources.length - 1) }));

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0 && index < sources.length - 1) {
      setState({ key, index: index + 1 });
    }
  }, [key, index, sources.length]);

  return (
    <img
      {...props}
      alt={alt}
      ref={ref}
      src={sources[index]}
      onError={index < sources.length - 1 ? advance : undefined}
      suppressHydrationWarning
    />
  );
}
