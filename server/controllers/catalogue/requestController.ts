import { RequestHandler } from 'express';
import Drug from '../../models/drugModel';
import Request, { IRequest } from '../../models/requestModel';
import AppError from '../../utils/AppError';
import catchAsync from '../../utils/catchAsync';

const createRequestToAddToCatalogue: RequestHandler = catchAsync(
  async (req, res, next) => {
    let type = '';
    let requestedOrganization;

    const { name, description, ingrediants = undefined } = req.body as IRequest;

    if (req.user && req.user.organization && 'type' in req.user.organization) {
      requestedOrganization = req.user.organization;
      if (req.user.organization.type === 'supplier') {
        type = 'raw-material';
      } else {
        type = 'drug';
      }
    }

    const request = await Request.create({
      name,
      description,
      ingrediants,
      type,
      requestedOrganization,
    });

    res.status(201).json({
      status: 'succcess',
      message: 'Request sent successfully',
      request,
    });
  }
);

const getRequest: RequestHandler<{ id: string }> = catchAsync(
  async (req, res, next) => {
    const reqId = req.params.id;
    const request = await Request.findById(reqId);

    res.status(200).json({
      status: 'succcess',
      data: {
        data: request,
      },
    });
  }
);

const getAllRequests: RequestHandler = catchAsync(async (req, res, next) => {
  const requests = await Request.find(
    {},
    {
      requestedOrganization: 0,
      approved: 0,
      approvedAt: 0,
      approvedOrganization: 0,
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      data: requests,
    },
  });
});

const handleRequestApproval: RequestHandler<{ id: string }> = catchAsync(
  async (req, res, next) => {
    const requestId = req.params.id;
    const { status: approval, code } = req.body as {
      status: string;
      code?: string;
    };

    const request = await Request.findById(requestId);

    if (!request || request.approved === true)
      return next(new AppError('The Request has already been processed.', 400));

    const { type, name, description, ingrediants } = request;

    if (approval === 'ACCEPTED') {
      if (!code)
        return next(new AppError('Please provide a code for the drug.', 400));

      const existingDrug = await Drug.findOne({ code });

      if (existingDrug)
        return next(new AppError('Drug with this code already exists!', 400));

      const updateObj: Partial<IRequest> = {
        approved: true,
        approvedOrganization: req.user?.organization?.id,
        approvedAt: new Date(Date.now()),
      };

      await Request.findByIdAndUpdate(requestId, updateObj);

      const drug = await Drug.create({
        type,
        name,
        description,
        ingrediants,
        code,
      });

      res.status(200).json({
        status: 'success',
        message: 'Drug has been added successfully',
        data: drug,
      });
    } else if (approval === 'REJECTED') {
      await Request.findByIdAndRemove(requestId);

      res.status(204).json({
        status: 'success',
        message: 'The Request has been turned down!',
      });
    }
    return next(
      new AppError('Status should be either APPROVED or REJECTED', 400)
    );
  }
);

export {
  createRequestToAddToCatalogue,
  getRequest,
  getAllRequests,
  handleRequestApproval,
};
