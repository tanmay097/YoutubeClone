/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { iconSrc } from "@/lib/client";

export function EmptyState({ title, body, cta }: { title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-20 text-center">
      <img src={iconSrc("empty-videos")} alt="" width={240} height={160} onError={(e) => (e.currentTarget.src = "/icons/empty-videos.svg")} />
      <h2 className="mt-6 text-xl font-bold">{title}</h2>
      <p className="mt-2 text-muted">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-6 rounded-full bg-fg px-5 py-2.5 text-sm font-semibold text-bg transition-opacity duration-200 hover:opacity-90"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
