import { Router } from "express";
import {
  url,
  callback,
  verify,
  logout,
  csrfToken,
  refresh,
  getToken } from "./auth.controller"
import { authenticated } from "../../middleware/auth.middleware"; 
import { validateCsrf } from "../../middleware/auth.middleware"; 
import {
  authUrlHourLimiter,
  authUrlTenMinuteLimiter,
  csrfLimiter,
  logoutLimiter,
  oauthCallbackLimiter,
  refreshIpFiveMinuteLimiter,
  refreshTokenMinuteLimiter,
  sessionPollLimiter,
} from "../../middleware/rateLimiter.middleware";

const router = Router();

router.get("/csrf", csrfLimiter, csrfToken);

router.get("/google/url", authUrlTenMinuteLimiter, authUrlHourLimiter, url);

router.get("/google/callback", oauthCallbackLimiter, callback);

router.get("/google/verify", authenticated, sessionPollLimiter, verify);

router.post("/google/logout", authenticated, logoutLimiter, validateCsrf, logout);

router.post("/google/refresh", refreshTokenMinuteLimiter, refreshIpFiveMinuteLimiter, refresh);

router.get("/token", authenticated, sessionPollLimiter, getToken);

export default router;
