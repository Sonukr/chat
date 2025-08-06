import { Request, Response, NextFunction } from 'express';
import logger from './logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime();

  logger.info({ method: req.method, url: req.originalUrl }, 'Incoming request');
  if (req.body && Object.keys(req.body).length > 0) {
    logger.info({ body: req.body }, 'Request body');
  }

  const oldJson = res.json.bind(res);
  res.json = (body: any): Response => {
    const diff = process.hrtime(start);
    const time = `${(diff[0] * 1e9 + diff[1]) / 1e6}ms`;

    logger.info({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: time,
      responseBody: body,
    }, 'Outgoing response');

    return oldJson(body);
  };

  next();
};