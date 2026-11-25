"use client";

import { IK_UPLOAD_FOLDERS, formatCount } from "@vidora/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/lib/client";
import { uploadImageToImageKit } from "@/lib/ikUpload";
import { useAuth } from "@/components/AuthProvider";
import { Avatar } from "@/components/Avatar";
import { IKIcon } from "@/components/IKIcon";

export default function AccountPage() {
  const { user, loading, setUser, logout } = useAuth();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (loading) return <div className="mx-auto mt-16 h-40 max-w-xl animate-pulse rounded-2xl bg-chip" />;
  if (!user) {
    return (
      <div className="mx-auto mt-20 max-w-md px-6 text-center">
        <IKIcon name="user" size={48} className="mx-auto" />
        <h1 className="mt-4 text-xl font-bold">You&apos;re not signed in</h1>
        <p className="mt-2 text-muted">Sign in to upload videos, subscribe to channels, like and comment.</p>
        <Link href="/login?next=/account" className="mt-6 inline-flex rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg">
          Sign in
        </Link>
      </div>
    );
  }

  async function changeAvatar(file?: File) {
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const url = await uploadImageToImageKit(file, IK_UPLOAD_FOLDERS.avatars);
      const r = await api.updateAvatar(url);
      setUser(r.user);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar src={user.avatarUrl} name={user.name} size={112} />
        <div>
          <h1 className="text-3xl font-bold">{user.name}</h1>
          <p className="text-muted">{user.email}</p>
          <p className="mt-1 text-sm text-muted">{formatCount(user.subscriberCount)} subscribers</p>
        </div>
      </div>
      {err && <p role="alert" className="mt-4 text-sm text-danger">{err}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-chip px-4 text-sm font-semibold transition-colors hover:bg-chip-hover disabled:opacity-60"
        >
          <IKIcon name="image" size={20} />
          {busy ? "Uploading…" : "Change avatar"}
        </button>
        <Link href="/upload" className="flex h-10 items-center gap-2 rounded-full bg-chip px-4 text-sm font-semibold transition-colors hover:bg-chip-hover">
          <IKIcon name="upload" size={20} />
          Upload video
        </Link>
        <button
          type="button"
          onClick={async () => { await logout(); router.push("/"); }}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-chip px-4 text-sm font-semibold transition-colors hover:bg-chip-hover"
        >
          <IKIcon name="logout" size={20} />
          Sign out
        </button>
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => changeAvatar(e.target.files?.[0])} />
    </div>
  );
}
