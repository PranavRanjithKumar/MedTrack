import { Request, Response, NextFunction, RequestHandler } from 'express';
import AppError from './AppError';

type CatchAyncFn = (
  arg0: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => RequestHandler;

const catchAsync: CatchAyncFn = (fn) => (req, res, next) => {
  fn(req, res, next).catch(next);
};

export default catchAsync;