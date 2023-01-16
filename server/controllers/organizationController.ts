import { RequestHandler } from 'express';
import Organization, { IOrganization } from '../models/organizationModel';
import catchAsync from '../utils/catchAsync';

const createOrganization: RequestHandler = catchAsync(
  async (req, res, next) => {
    const { name, code, email, address, city, state } =
      req.body as IOrganization;
    let type;
    if (req.user && req.user.organization && 'type' in req.user.organization) {
      ({ type } = req.user.organization);
    }

    const organization = await Organization.create({
      name,
      code,
      email,
      type,
      address,
      city,
      state,
    });
    res.status(201).json({
      status: 'succcess',
      message: 'Organization created successfully',
      organization,
    });
  }
);

// eslint-disable-next-line import/prefer-default-export
export { createOrganization };
