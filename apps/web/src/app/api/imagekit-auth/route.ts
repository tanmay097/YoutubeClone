import { getUserId } from "@/lib/auth";
import { handler, json, unauthorized } from "@/lib/http";
import { createUploadAuth } from "@/lib/imagekit";

export const GET = handler(async (req: Request) => {
  if (!(await getUserId(req))) return unauthorized();
  return json(createUploadAuth());
});
