"use client";

/* eslint-disable @next/next/no-img-element */
import { ALLOWED_VIDEO_TYPES, IK_UPLOAD_FOLDERS, MAX_VIDEO_BYTES, videoMetaSchema } from "@vidora/shared";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { uploadImageToImageKit } from "@/lib/ikUpload";
import { IKIcon } from "@/components/IKIcon";
import { primaryBtn } from "@/components/Field";

type Stage = "idle" | "uploading" | "done";

export default function UploadPage() {
  const router = useRouter();
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [thumbPct, setThumbPct] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pct, setPct] = useState(0);
  const [stage, setStage] = useState<Stage>("idle");
  const [err, setErr] = useState<string | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const thumbInput = useRef<HTMLInputElement>(null);

  function pickVideo(file?: File) {
    setErr(null);
    if (!file) return;
    if (!(ALLOWED_VIDEO_TYPES as readonly string[]).includes(file.type)) return setErr("Only MP4, WebM or MOV videos are supported.");
    if (file.size > MAX_VIDEO_BYTES) return setErr("Video must be under 500 MB.");
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, "").slice(0, 100));
  }

  async function pickThumb(file?: File) {
    setErr(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr("Thumbnail must be an image.");
    if (file.size > 10 * 1024 * 1024) return setErr("Thumbnail must be under 10 MB.");
    setThumbPct(0);
    try {
      setThumbUrl(await uploadImageToImageKit(file, IK_UPLOAD_FOLDERS.thumbnails, setThumbPct));
    } catch (e) {
      setErr(`Thumbnail upload failed: ${(e as Error).message}`);
    } finally {
      setThumbPct(null);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!video) return setErr("Choose a video to upload.");
    const meta = videoMetaSchema.safeParse({ title, description, thumbnailUrl: thumbUrl ?? "" });
    if (!meta.success) return setErr(meta.error.issues[0].message);

    const body = new FormData();
    body.append("title", meta.data.title);
    body.append("description", meta.data.description);
    body.append("thumbnailUrl", meta.data.thumbnailUrl);
    body.append("video", video); // file last so fields are parsed first

    // XHR (not fetch) so we get upload progress events.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/videos");
    xhr.upload.onprogress = (ev) => ev.lengthComputable && setPct(Math.round((ev.loaded / ev.total) * 100));
    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300) {
        setStage("done");
        router.push(`/watch/${res.video.id}`);
      } else {
        setStage("idle");
        setErr(res.error || "Upload failed");
      }
    };
    xhr.onerror = () => {
      setStage("idle");
      setErr("Network error during upload");
    };
    setStage("uploading");
    setPct(0);
    xhr.send(body);
  }

  const busy = stage !== "idle";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold">Upload video</h1>
      <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {!video ? (
            <button
              type="button"
              onClick={() => videoInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickVideo(e.dataTransfer.files[0]);
              }}
              className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-line bg-surface transition-colors duration-200 hover:border-muted"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-chip">
                <IKIcon name="upload" size={36} />
              </span>
              <span className="text-base font-semibold">Drag and drop a video, or click to select</span>
              <span className="text-sm text-muted">MP4, WebM or MOV · up to 500 MB</span>
            </button>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-black">
              <video src={videoPreview ?? undefined} controls className="aspect-video w-full" />
              <div className="flex items-center justify-between gap-3 bg-surface px-4 py-3 text-sm">
                <span className="truncate">{video.name}</span>
                {!busy && (
                  <button
                    type="button"
                    onClick={() => { setVideo(null); setVideoPreview(null); }}
                    className="cursor-pointer font-semibold text-link"
                  >
                    Change
                  </button>
                )}
              </div>
            </div>
          )}
          <input ref={videoInput} type="file" accept={ALLOWED_VIDEO_TYPES.join(",")} hidden onChange={(e) => pickVideo(e.target.files?.[0])} />

          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">Title (required)</label>
            <input
              id="title"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title that describes your video"
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 outline-none transition-colors placeholder:text-muted focus:border-link"
            />
            <p className="mt-1 text-right text-xs text-muted">{title.length}/100</p>
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Description</label>
            <textarea
              id="description"
              value={description}
              maxLength={5000}
              rows={5}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video"
              className="w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 outline-none transition-colors placeholder:text-muted focus:border-link"
            />
          </div>
        </div>

        <aside className="space-y-5">
          <div>
            <p className="mb-1.5 text-sm font-medium">Thumbnail (required)</p>
            <p className="mb-3 text-xs text-muted">Stored on ImageKit. Use 16:9, like 1280×720.</p>
            <button
              type="button"
              onClick={() => thumbInput.current?.click()}
              disabled={thumbPct !== null || busy}
              className="relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-surface transition-colors hover:border-muted"
            >
              {thumbUrl ? (
                <img src={thumbUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
              ) : (
                <span className="flex flex-col items-center gap-2 text-sm text-muted">
                  <IKIcon name="image" size={28} />
                  Upload thumbnail
                </span>
              )}
              {thumbPct !== null && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm font-semibold">
                  Uploading {thumbPct}%
                </span>
              )}
            </button>
            <input ref={thumbInput} type="file" accept="image/*" hidden onChange={(e) => pickThumb(e.target.files?.[0])} />
          </div>

          {err && (
            <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
              {err}
            </p>
          )}

          {stage === "uploading" && (
            <div aria-live="polite">
              <div className="mb-1 flex justify-between text-sm">
                <span>Uploading video…</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-chip">
                <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          <button type="submit" disabled={busy || thumbPct !== null} className={primaryBtn}>
            {stage === "uploading" ? "Uploading…" : stage === "done" ? "Published!" : "Publish"}
          </button>
        </aside>
      </form>
    </div>
  );
}
