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
// import { authLimiter } from "../../middleware/auth.middleware"; 

const router = Router();

router.get("/csrf", csrfToken);

router.get("/google/url", url);

router.get("/google/callback", callback);

router.get("/google/verify", authenticated, verify);

router.post("/google/logout", authenticated, validateCsrf, logout);

router.post("/google/refresh", refresh);

router.get("/token", authenticated, getToken);

export default router;