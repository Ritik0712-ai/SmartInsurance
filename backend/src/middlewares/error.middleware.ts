import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, error: err.message });
    return;
  }

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({ success: false, error: 'Database operation failed' });
    return;
  }

  res.status(500).json({ success: false, error: 'Internal server error' });
};
