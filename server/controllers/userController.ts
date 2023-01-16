import { RequestHandler } from 'express';
import User, { IUser } from '../models/userModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';

const createUser: RequestHandler = catchAsync(async (req, res, next) => {
  const { name, organization, email, role, password } = req.body as IUser;
  const user = await User.create({
    name,
    organization,
    email,
    role,
    password,
  });
  res.status(201).json({
    status: 'succcess',
    message: 'User created successfully',
    user,
  });
});

const getUser: RequestHandler<{ id: string }> = catchAsync(
  async (req, res, next) => {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) return new AppError('No user found with that ID', 400);

    res.status(200).json({
      status: 'success',
      data: {
        data: user,
      },
    });
  }
);

export { createUser, getUser };
