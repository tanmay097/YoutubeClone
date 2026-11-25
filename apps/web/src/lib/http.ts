import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import type { ZodError } from "zod";

export const json = <T>(data: T, status = 200) => NextResponse.json(data, { status });
export const error = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
export const unauthorized = () => error("Please sign in to continue", 401);
export const notFound = (what = "Resource") => error(`${what} not found`, 404);
export const zodMessage = (e: ZodError) => e.issues[0]?.message ?? "Invalid input";
export const isId = (id: string) => isValidObjectId(id);

/** Wraps a route handler so unexpected errors become JSON 500s instead of HTML pages. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error && process.env.NODE_ENV !== "production" ? e.message : "Something went wrong";
      return error(message, 500);
    }
  };
}
