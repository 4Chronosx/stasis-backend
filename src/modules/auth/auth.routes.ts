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
  authCsrfRateLimiter,
  authLogoutRateLimiter,
  authOAuthCallbackRateLimiter,
  authOAuthUrlRateLimiter,
  authRefreshRateLimiter,
  authSessionReadRateLimiter,
} from "../../middleware/rateLimiter.middleware";
import { validateSchema } from "../../middleware/validator.middleware";
import { googleCallbackSchema } from "./auth.schema";
// import { authLimiter } from "../../middleware/auth.middleware"; 

const router: Router = Router();

router.get("/csrf", authCsrfRateLimiter, csrfToken);

router.get("/google/url", authOAuthUrlRateLimiter, url);

router.get("/google/callback", authOAuthCallbackRateLimiter, validateSchema(googleCallbackSchema), callback);

router.get("/google/verify", authenticated, authSessionReadRateLimiter, verify);

router.post("/google/logout", authenticated, authLogoutRateLimiter, validateCsrf, logout);

router.post("/google/refresh", authRefreshRateLimiter, refresh);

router.get("/token", authenticated, authSessionReadRateLimiter, getToken);

export default router;
