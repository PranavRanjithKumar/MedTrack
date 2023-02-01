import { RequestHandler } from 'express';
import { IOrganization } from '../models/organizationModel';
import User, { IUser } from '../models/userModel';
import AppError from '../utils/AppError';
import catchAsync from '../utils/catchAsync';
import { createUserIdentity } from '../utils/CAUtils';

const createUser: RequestHandler = catchAsync(async (req, res, next) => {
  const { name, email, role, password, organization } = req.body as IUser;

  const user = await (
    await User.create({
      name,
      organization,
      email,
      role,
      password,
    })
  ).populate('organization');

  if (user)
    await createUserIdentity(
      user.email,
      (user.organization as IOrganization).type,
      role,
      user.organization?.id as string,
      req.user?.email as string
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
