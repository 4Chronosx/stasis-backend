import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  name: string;
  pictureUrl: string;
}

interface RequestCookies {
  access_token?: string;
  refresh_token?: string;
  csrf_token?: string;
  oauth_state?: string;
}

export type CookieRequest<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = Record<string, unknown>,
> = Request<P, ResBody, ReqBody, ReqQuery> & { cookies: RequestCookies };

export type AuthRequest = CookieRequest & { user?: AccessTokenPayload };

const isAccessTokenPayload = (value: unknown): value is AccessTokenPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  return (
    typeof payload.userId === "string" &&
    typeof payload.email === "string" &&
    typeof payload.name === "string" &&
    typeof payload.pictureUrl === "string"
  );
};

export const authenticated = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const accessToken = req.cookies.access_token;

  if (!accessToken) {
    console.log("[AUTH] No access token found in cookies. Cookies:", Object.keys(req.cookies));
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!);

    if (!isAccessTokenPayload(decoded)) {
      console.warn("[AUTH] Token payload invalid.");
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = decoded;
    console.log("[AUTH] Token verified successfully for user:", decoded.userId);
    next();
  } catch (error) {
    console.error("[AUTH] Token verification failed:", error instanceof Error ? error.message : error);
    return res.status(401).json({ message: "Access token expired" });
  }
};

export const validateCsrf = (
  req: CookieRequest,
  res: Response,
  next: NextFunction,
) => {
  const cookieToken = req.cookies.csrf_token;
  const rawHeader = req.headers["x-csrf-token"];
  const headerToken = typeof rawHeader === "string" ? rawHeader : undefined;

  if (!cookieToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  next();
};
