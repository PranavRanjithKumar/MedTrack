/* eslint-disable no-underscore-dangle */
import { RequestHandler, Response } from 'express';
import jwt, { Secret } from 'jsonwebtoken';
import { Types, Document } from 'mongoose';
import User, { IUser, IUserMethods } from '../models/userModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';

interface JwtType {
  id: string;
  iat: number;
  exp: number;
}

type UserDocument = Document<unknown, any, IUser> &
  IUser & {
    _id: Types.ObjectId;
  } & IUserMethods;

const signToken = (id: Types.ObjectId) =>
  jwt.sign({ id }, process.env.JWT_SECRET as Secret, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (
  user: UserDocument,
  statusCode: number,
  res: Response<any, Record<string, any>>
) => {
  const token = signToken(user._id);

  // Remove password from output
  // eslint-disable-next-line no-param-reassign
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

const login: RequestHandler = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (
    !user ||
    !(await user.correctPassword(password, user.password as string))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

const protect: RequestHandler = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  let decodedToken = null;
  jwt.verify(token, process.env.JWT_SECRET as Secret, (err, decoded) => {
    if (err) return next(new AppError('Error in verifying your token', 401));
    console.log(decoded);
    decodedToken = decoded;
  });

  if (!decodedToken)
    return next(new AppError('Error in verifying your token', 401));

  // 3) Check if user still exists
  const currentUser = await User.findById((decodedToken as JwtType).id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  console.log(currentUser._id);

  // // 4) Check if user changed password after the token was issued
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError('User recently changed password! Please log in again.', 401)
  //   );
  // }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

export { signToken, login, protect };
