import express, { Request, Response, NextFunction } from "express";
import { env } from "./config/env";
import authRoutes from "./modules/auth/auth.routes";
import cookieParser from "cookie-parser";
import { startStreakReminderJob } from "./modules/notifications/notifications.cron";
const app = express();

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

app.get("/health", (_req: Request, res: Response) => {
	res.status(200).json({
		status: "ok",
		environment: env.NODE_ENV,
		timestamp: new Date().toISOString(),
	});
});

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
app.use("/api", (_req: Request, res: Response) => {
	res.status(501).json({
		message: "API routes are not wired yet.",
	});
});

app.use((_req: Request, res: Response) => {
	res.status(404).json({
		message: "Route not found.",
	});
});

app.use((error: unknown, _req: Request, res: Response) => {
	const statusCode = 500;
	const fallbackMessage = "Internal server error.";
	const message = error instanceof Error ? error.message : fallbackMessage;

	res.status(statusCode).json({ message });
});

app.listen(env.PORT, () => {
	console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
	startStreakReminderJob();
});