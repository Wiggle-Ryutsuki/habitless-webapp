import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  code: string;
  fieldErrors?: Array<{ field: string; message: string }>;

  constructor(statusCode: number, code: string, message: string, fieldErrors?: Array<{ field: string; message: string }>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-correlation-id'] as string) || `hl-req-${Date.now()}`;

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
        correlationId,
      },
    });
  }

  // Handle JSON parse errors from body-parser
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload.',
        correlationId,
      },
    });
  }

  console.error('[UNHANDLED_ERROR]', err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred.',
      correlationId,
    },
  });
}

