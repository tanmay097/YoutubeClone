import { registerSchema } from "@vidora/shared";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { error, handler, json, zodMessage } from "@/lib/http";
import { setAuthCookie, signToken } from "@/lib/auth";
import { toPublicUser } from "@/lib/serialize";

export const POST = handler(async (req: Request) => {
  const parsed = registerSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return error(zodMessage(parsed.error));
  const { name, email, password } = parsed.data;

  await connectDB();
  if (await User.exists({ email })) return error("An account with this email already exists", 409);

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 10) });
  const token = await signToken(String(user._id));
  await setAuthCookie(token);
  return json({ user: toPublicUser(user, true), token }, 201);
});
