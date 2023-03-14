import { RequestHandler } from 'express';
import Organization, { IOrganization } from '../models/organizationModel';
import catchAsync from '../utils/catchAsync';

const allOrganizations = [
  'supplier',
  'manufacturer',
  'distributor',
  'retailer',
];

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

const getRequestableOrganizations: RequestHandler = catchAsync(
  async (req, res, next) => {
    const userOrganizationType = (req.user?.organization as IOrganization).type;

    const requestableOragnizationTypeIndex =
      allOrganizations.findIndex((type) => type === userOrganizationType) - 1;

    if (requestableOragnizationTypeIndex >= 0) {
      const requestableOrganizations = await Organization.find({
        type: allOrganizations[requestableOragnizationTypeIndex],
      });
      res.status(200).json({
        status: 'success',
        data: requestableOrganizations,
      });
    } else {
      res.status(200).json({
        status: 'success',
        data: [],
      });
    }
  }
);

export { createOrganization, getRequestableOrganizations };
