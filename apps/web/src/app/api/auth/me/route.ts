import { avatarSchema } from "@vidora/shared";
import { getCurrentUser } from "@/lib/auth";
import { error, handler, json, unauthorized } from "@/lib/http";
import { toPublicUser } from "@/lib/serialize";
import { isImageKitUrl } from "@/lib/imagekit";

export const GET = handler(async (req: Request) => {
  const user = await getCurrentUser(req);
  return json({ user: user ? toPublicUser(user, true) : null });
});

export const PATCH = handler(async (req: Request) => {
  const user = await getCurrentUser(req);
  if (!user) return unauthorized();
  const parsed = avatarSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success || !isImageKitUrl(parsed.data.avatarUrl)) return error("Invalid avatar URL");
  user.avatarUrl = parsed.data.avatarUrl;
  await user.save();
  return json({ user: toPublicUser(user, true) });
});
