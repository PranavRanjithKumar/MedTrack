import { RequestHandler } from 'express';
import Organization, { IOrganization } from '../models/organizationModel';
import catchAsync from '../utils/catchAsync';

const createOrganization: RequestHandler = catchAsync(
  async (req, res, next) => {
    const org = req.body as IOrganization;
    const organization = await Organization.create({
      name: org.name,
      code: org.code,
      email: org.email,
      type: org.type,
      address: org.address,
      city: org.city,
      state: org.state,
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
