"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { IKIcon } from "./IKIcon";

export function SubscribeButton({
  channelId,
  initial,
  onCount,
}: {
  channelId: string;
  initial: boolean;
  onCount: (n: number) => void;
}) {
  const [subscribed, setSubscribed] = useState(initial);
  const [busy, setBusy] = useState(false);
  const requireAuth = useRequireAuth();

  async function toggle() {
    if (!requireAuth() || busy) return;
    setBusy(true);
    setSubscribed((s) => !s); // optimistic
    try {
      const r = await api.toggleSubscribe(channelId);
      setSubscribed(r.subscribed);
      onCount(r.subscriberCount);
    } catch {
      setSubscribed((s) => !s);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={subscribed}
      className={`flex h-9 cursor-pointer items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-200 ${
        subscribed ? "bg-chip text-fg hover:bg-chip-hover" : "bg-fg text-bg hover:bg-fg/85"
      }`}
    >
      {subscribed && <IKIcon name="bell" size={18} />}
      {subscribed ? "Subscribed" : "Subscribe"}
    </button>
  );
}
