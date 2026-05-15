import http from "node:http";

import express, { Request, Response, NextFunction } from "express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { startStreakReminderJob } from "./modules/notifications/notifications.cron";
import decksRouter from "./modules/decks/decks.routes";
import cardsRouter from "./modules/cards/cards.routes";
import sessionsRouter from "./modules/sessions/sessions.routes";
import emotionRouter from "./modules/emotion/emotion.routes";
import onboardingRouter from "./modules/onboarding/onboarding.routes";
import { hydrateRequestSession } from "./middleware/auth.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { rateLimiter } from "./middleware/rateLimiter.middleware";
import { initializeSocket } from "./socket";

const app = express();
const server = http.createServer(app);

app.disable("x-powered-by");
app.use(cookieParser());
app.use((req: Request, res: Response, next: NextFunction) => {
	res.setHeader("Access-Control-Allow-Origin", env.CLIENT_URL);
	res.setHeader("Vary", "Origin");
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
	res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

	if (req.method === "OPTIONS") {
		res.sendStatus(204);
		return;
	}

	next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);
app.use(hydrateRequestSession);

app.get("/docs.json", (_req: Request, res: Response) => {
	res.status(200).json(swaggerSpec);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags:
 *       - System
 *     responses:
 *       "200":
 *         description: Service is healthy
 */
app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({
		status: "ok",
		environment: env.NODE_ENV,
		timestamp: new Date().toISOString(),
	});
});

/**
 * @openapi
 * /:
 *   get:
 *     summary: Service info
 *     tags:
 *       - System
 *     responses:
 *       "200":
 *         description: Service metadata
 */
app.get("/", (_req: Request, res: Response) => {
	res.status(200).json({
		name: "STASIS Backend",
		status: "running",
	});
});

// TODO: wire routes here
// app.use("/api/auth", authRoutes);
// app.use("/api/flashcards", flashcardsRoutes);
// ...
app.use("/auth", authRoutes);
app.use("/api", onboardingRouter);
app.use("/api", (_req: Request, res: Response) => {
	res.status(501).json({
		message: "API routes are not wired yet.",
	});
});

app.use("/decks", decksRouter);
app.use("/decks/:deckId/cards", cardsRouter);
app.use("/decks/:deckId/session", sessionsRouter);
app.use("/emotion", emotionRouter);

app.use(notFoundHandler);
app.use(errorHandler);

/*

GET    /decks
POST   /decks
GET    /decks/:id
DELETE /decks/:id

GET    /decks/:deckId/cards
POST   /decks/:deckId/cards
PUT    /decks/:deckId/cards/:id
DELETE /decks/:deckId/cards/:id

GET    /decks/:deckId/session
POST   /decks/:deckId/session
*/

initializeSocket(server, hydrateRequestSession);

server.listen(env.PORT, () => {
	console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
	startStreakReminderJob();
});
