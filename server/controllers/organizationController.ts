import { RequestHandler } from 'express';
import Organization, { IOrganization } from '../models/organizationModel';

const createOrganization: RequestHandler = async (req, res, next) => {
  try {
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
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      message: 'Something went wrong',
      error,
    });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { createOrganization };
