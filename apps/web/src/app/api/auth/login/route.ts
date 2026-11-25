import { loginSchema } from "@vidora/shared";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { error, handler, json, zodMessage } from "@/lib/http";
import { setAuthCookie, signToken } from "@/lib/auth";
import { toPublicUser } from "@/lib/serialize";

export const POST = handler(async (req: Request) => {
  const parsed = loginSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return error(zodMessage(parsed.error));
  const { email, password } = parsed.data;

  await connectDB();
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return error("Incorrect email or password", 401);
  }
  const token = await signToken(String(user._id));
  await setAuthCookie(token);
  return json({ user: toPublicUser(user, true), token });
});
