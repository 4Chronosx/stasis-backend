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

/**
 * @openapi
 * /auth/csrf:
 *   get:
 *     summary: Get a CSRF token
 *     tags:
 *       - Auth
 *     responses:
 *       "200":
 *         description: CSRF token set in cookie and returned in body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 csrfToken:
 *                   type: string
 */
router.get("/csrf", csrfToken);

/**
 * @openapi
 * /auth/google/url:
 *   get:
 *     summary: Get the Google OAuth authorization URL
 *     tags:
 *       - Auth
 *     responses:
 *       "200":
 *         description: Google OAuth URL to redirect the user to
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       "500":
 *         description: Failed to initiate OAuth flow
 */
router.get("/google/url", url);

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Handles the OAuth redirect from Google. Sets access_token and refresh_token cookies then redirects to the frontend.
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "302":
 *         description: Redirects to frontend on success or error
 */
router.get("/google/callback", callback);

/**
 * @openapi
 * /auth/google/verify:
 *   get:
 *     summary: Verify the current session and return user info
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Authenticated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       "401":
 *         description: Unauthorized
 */
router.get("/google/verify", authenticated, verify);

/**
 * @openapi
 * /auth/google/logout:
 *   post:
 *     summary: Log out the current user
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: header
 *         name: x-csrf-token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       "200":
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       "401":
 *         description: Unauthorized or invalid CSRF token
 */
router.post("/google/logout", authenticated, validateCsrf, logout);

/**
 * @openapi
 * /auth/google/refresh:
 *   post:
 *     summary: Refresh the access token using the refresh_token cookie
 *     tags:
 *       - Auth
 *     responses:
 *       "200":
 *         description: Access token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       "401":
 *         description: Missing, invalid, or expired refresh token
 */
router.post("/google/refresh", refresh);

/**
 * @openapi
 * /auth/token:
 *   get:
 *     summary: Get the current access token from cookie
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Access token value
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *       "401":
 *         description: Unauthorized
 */
router.get("/token", authenticated, getToken);

export default router;