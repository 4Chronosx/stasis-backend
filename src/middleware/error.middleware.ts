import { NextFunction, Request, Response } from "express";

import { AppError } from "../types";

export const notFoundHandler = (_req: Request, res: Response) => {
	res.status(404).json({
		message: "Route not found.",
	});
};

export const errorHandler = (
	error: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
) => {
	void _next;

	const appError = error instanceof AppError ? error : null;
	const statusCode = appError?.statusCode ?? 500;
	const message =
		error instanceof Error ? error.message : appError?.message ?? "Internal server error.";

	res.status(statusCode).json({ message });
};
