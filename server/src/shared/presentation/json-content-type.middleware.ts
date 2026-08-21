import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Rejects requests with a body that don't declare Content-Type: application/json.
 * Prevents content-type confusion attacks (CSRF via form submissions, XML injection, etc.).
 * Applied globally to all routes.
 */
@Injectable()
export class JsonContentTypeMiddleware implements NestMiddleware {
  private readonly METHODS_WITH_BODY = new Set([
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
  ]);

  use(req: Request, res: Response, next: NextFunction): void {
    const method = req.method.toUpperCase();
    const contentLength = req.headers['content-length'];
    const hasBody =
      this.METHODS_WITH_BODY.has(method) &&
      contentLength !== undefined &&
      contentLength !== '0';

    if (hasBody) {
      const contentType = req.headers['content-type'] ?? '';
      if (!contentType.includes('application/json')) {
        res.status(415).json({
          statusCode: 415,
          message:
            'Unsupported Media Type. Content-Type must be application/json',
        });
        return;
      }
    }

    next();
  }
}
