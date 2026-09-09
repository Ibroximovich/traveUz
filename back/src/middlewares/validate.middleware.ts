import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory.
 * @param schema - Zod schema to validate against
 * @param target - Part of the request to validate: 'body' | 'query' | 'params'
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = (result.error as ZodError).flatten().fieldErrors;
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace request data with parsed (typed + coerced) data
    req[target] = result.data;
    next();
  };
}
