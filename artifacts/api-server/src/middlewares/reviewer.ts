import type { NextFunction, Request, Response } from "express";
import { getAuthenticatedUserId } from "./auth";

function reviewerIds(): string[] {
  return (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function requireReviewer(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = getAuthenticatedUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!reviewerIds().includes(userId)) {
    res.status(403).json({ error: "Reviewer access required" });
    return;
  }
  next();
}