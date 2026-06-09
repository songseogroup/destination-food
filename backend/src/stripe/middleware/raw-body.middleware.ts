import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as getRawBody from 'raw-body';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.path === '/stripe/webhook') {
      const rawBody = await getRawBody(req);
      (req as any).rawBody = rawBody;
    }
    next();
  }
}
