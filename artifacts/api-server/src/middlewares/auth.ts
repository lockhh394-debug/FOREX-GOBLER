import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export function getAuthenticatedUserId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!getAuthenticatedUserId(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}