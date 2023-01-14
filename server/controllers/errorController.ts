import { ErrorRequestHandler, Request, Response } from 'express';
import { Error } from 'mongoose';
import { MongoError } from 'mongodb';
import AppError from '../utils/AppError';

const sendErrorDev = (error: AppError, req: Request, res: Response) => {
  const status = error.status || 'Error';
  const statusCode = error.statusCode || 500;
  const { message, stack } = error as Error;

  return res.status(statusCode).json({
    status,
    error,
    message,
    stack,
  });
};

const sendErrorProd = (error: AppError, req: Request, res: Response) => {
  const status = error.status || 'Error';
  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Something went wrong';

  return res.status(statusCode).json({
    status,
    message,
  });
};

const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof Error.CastError) {
    err = new AppError(`Cannot cast the value for the field: ${err.path}`, 400);
  } else if (err instanceof Error.ValidationError) {
    err = new AppError(err.errors.name.message, 400);
  } else if ((err as MongoError).code === 11000) {
    let message: string[] = [];
    const duplicateField = (err as MongoError).message.match(/{(.*?)}/);
    if (duplicateField) {
      message = duplicateField[1].trim().split(':');
    }
    err = new AppError(`The "${message[0]}" already exists!`, 400);
  }

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, req, res);
  }
};

export default globalErrorHandler;
