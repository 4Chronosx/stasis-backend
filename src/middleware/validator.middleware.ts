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
      await schema.parseAsync({
        body: req.body as unknown,
        query: req.query,
        params: req.params,
      });

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
