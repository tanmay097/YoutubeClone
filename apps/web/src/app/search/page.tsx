"use client";

import type { SearchResults } from "@vidora/shared";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { ChannelRow } from "@/components/ChannelRow";
import { VideoCard, VideoCardSkeleton } from "@/components/VideoCard";
import { EmptyState } from "@/components/EmptyState";

export default function SearchPage() {
  return (
    <Suspense>
      <Results />
    </Suspense>
  );
}

function Results() {
  const q = (useSearchParams().get("q") ?? "").trim();
  const [data, setData] = useState<{ q: string; results: SearchResults } | null>(null);
  const [err, setErr] = useState<{ q: string; message: string } | null>(null);

  useEffect(() => {
    if (!q) return;
    document.title = `${q} · Vidora`;
    let live = true;
    api
      .search(q)
      .then((results) => live && setData({ q, results }))
      .catch((e: Error) => live && setErr({ q, message: e.message }));
    return () => {
      live = false;
    };
  }, [q]);

  if (!q) return <EmptyState title="Search Vidora" body="Find channels and videos using the search bar above." />;
  if (err?.q === q) return <EmptyState title="Search failed" body={err.message} />;

  const results = data?.q === q ? data.results : null;
  if (results && results.channels.length === 0 && results.videos.length === 0) {
    return <EmptyState title="No results found" body={`Nothing matched “${q}”. Try a different channel name or video title.`} />;
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 pt-4 sm:px-6">
      <h1 className="sr-only">Search results for {q}</h1>
      {results ? (
        <>
          {results.channels.length > 0 && (
            <section aria-labelledby="channels-h" className="mb-6 border-b border-line pb-4">
              <h2 id="channels-h" className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                Channels
              </h2>
              <div className="flex flex-col gap-1">
                {results.channels.map((c) => (
                  <ChannelRow key={c.id} channel={c} />
                ))}
              </div>
            </section>
          )}
          {results.videos.length > 0 && (
            <section aria-labelledby="videos-h">
              <h2 id="videos-h" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                Videos
              </h2>
              <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {results.videos.map((v) => (
                  <VideoCard key={v.id} video={v} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }, (_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
