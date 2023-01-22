import { RequestHandler } from 'express';
import { IOrganization } from '../models/organizationModel';
import User, { IUser } from '../models/userModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { createUserIdentity } from '../utils/CAUtils';

const createUser: RequestHandler = catchAsync(async (req, res, next) => {
  let organization;
  const { name, email, role, password } = req.body as IUser;
  if (req.user?.role === 'manager') {
    ({ organization } = req.user);
    if (role === 'admin')
      return next(new AppError('Cannot create user with Admin role', 403));
  } else {
    ({ organization } = req.body as IUser);
  }
  const user = await User.create({
    name,
    organization,
    email,
    role,
    password,
  });

  if (user)
    await createUserIdentity(
      user.email,
      (user.organization as IOrganization).type,
      role,
      req
    );

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

    if (!user) return next(new AppError('No user found with that ID', 400));

    res.status(200).json({
      status: 'success',
      data: {
        data: user,
      },
    });
  }
);

const getAllUsers: RequestHandler<{ orgId: string }> = catchAsync(
  async (req, res, next) => {
    let orgQuery = {};
    if (req.params.orgId) orgQuery = { organization: req.params.orgId };
    const user = await User.find(orgQuery);

    if (!user) return next(new AppError('No users found!', 200));

    res.status(200).json({
      status: 'success',
      data: {
        data: user,
      },
    });
  }
);

export { createUser, getUser, getAllUsers };
