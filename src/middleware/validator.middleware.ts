import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError } from "zod";

/**
 * Express middleware to validate request payload (body, query, params) using Zod.
 * 
 * @param schema A Zod object schema containing optional `body`, `query`, and/or `params` definitions.
 */

export const validateSchema = (schema: ZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body as unknown,
        query: req.query,
        params: req.params,
      }) as { body?: unknown; query?: unknown; params?: unknown };

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        if (req.query && typeof req.query === "object") {
          const query = req.query as Record<string, unknown>;
          for (const key of Object.keys(query)) {
            delete query[key];
          }
          Object.assign(query, parsed.query as Record<string, unknown>);
        }
      }
      if (parsed.params !== undefined) {
        req.params = parsed.params as typeof req.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};
