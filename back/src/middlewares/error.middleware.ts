import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { getLocalizedError, localizedErrors } from '../utils/i18n';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Global error handler middleware.
 * Must be registered last in the Express app.
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  const lang = req.lang || 'uz';
  const statusCode = err.statusCode ?? 500;
  let rawMessage = err.message ?? 'Internal Server Error';
  
  // Translate message if it matches a known error key or string
  let message = getLocalizedError(rawMessage, lang);
  if (message === rawMessage && statusCode === 500) {
    message = localizedErrors.internalError[lang] || localizedErrors.internalError.uz;
  }

  console.error(`[ERROR] ${req.method} ${req.path} — ${statusCode}: ${rawMessage}`);
  if (env.isDev && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.isDev && { stack: err.stack }),
  });
}

/**
 * 404 Not Found middleware.
 * Must be registered after all routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const lang = req.lang || 'uz';
  res.status(404).json({
    success: false,
    message: `${localizedErrors.notFound[lang] || localizedErrors.notFound.uz} (${req.method} ${req.originalUrl})`,
  });
}

/**
 * Helper to create an error with a custom status code
 */
export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpError';
  }
}
