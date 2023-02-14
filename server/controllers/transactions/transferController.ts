import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { RequestHandler } from 'express';
import Catalogue from '../../models/catalogueModel';
import Organization, { IOrganization } from '../../models/organizationModel';
import AppError from '../../utils/AppError';
import { getPharmaceuticalTransferContract } from '../../utils/appUtils';
import catchAsync from '../../utils/catchAsync';

const requestableOrgs = ['manufacturer', 'distributor', 'retailer', 'consumer'];

const makeRequest: RequestHandler = catchAsync(async (req, res, next) => {
  const contract = getPharmaceuticalTransferContract(req);

  const id = uuidv4();
  const docType = 'request';
  const status = 'sent';
  const requestedDate = new Date().toISOString();
  const requestingOrgId = req.user?.organization?.id;
  const requestingOrgType = (req.user?.organization as IOrganization).type;
  const { transferringOrgId, latitude, longitude, requestedItems } =
    req.body as {
      transferringOrgId: string;
      latitude: number;
      longitude: number;
      requestedItems: {
        catalogueId: string;
        quantity: number;
        quantityType: string;
      }[];
    };

  const transferringOrg = await Organization.findById(transferringOrgId);

  // Allow only organizations to request to the
  // immediate preceeding organization in the supply chain
  if (!transferringOrg)
    return next(new AppError('No organization found with this ID', 400));

  const transferringOrgType = transferringOrg.type;

  const transferringOrgIndex = requestableOrgs.findIndex(
    (type) => type === transferringOrgType
  );

  if (requestableOrgs[transferringOrgIndex + 1] !== requestingOrgType)
    return next(new AppError('You cannot request from this organization', 400));

  // Check if the requested drugs are present in the transferring organization catalogue
  const agg = [
    {
      $match: {
        organization: new mongoose.Types.ObjectId(transferringOrgId),
      },
    },
    {
      $group: {
        _id: '$organization',
        drugs: {
          $push: '$code',
        },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ];

  // Get the catalogue items of the organization
  const { drugs: drugItemsInCatalogue } = (
    (await Catalogue.aggregate(agg)) as {
      drugs: string[];
    }[]
  )[0];

  // Get the requested catalogue items
  const requestedCatalogueDrugs = requestedItems.map(
    (item) => item.catalogueId
  );

  // Check if all the requested items are in the catalogue
  const allPresent = requestedCatalogueDrugs.every((drugId) =>
    drugItemsInCatalogue.includes(drugId)
  );

  // If not present throw bad request
  if (!allPresent)
    return next(
      new AppError(
        `One or more requested items are not present in the organization's catalogue`,
        400
      )
    );

  const newRequest = {
    id,
    docType,
    requestingOrgId,
    requestingOrgType,
    transferringOrgId,
    transferringOrgType,
    requestedDate,
    requestedFromLocation: [latitude, longitude],
    status,
    requestedItems,
  };

  await contract.submitTransaction('makeRequest', JSON.stringify(newRequest));

  res.status(201).json({
    status: 'success',
    message: 'Request sent successfully',
  });
});

const getAllRequests: RequestHandler<{ orgId: string }> = catchAsync(
  async (req, res, next) => {
    const contract = getPharmaceuticalTransferContract(req);

    const allRequests = (
      await contract.submitTransaction('getAllRequests')
    ).toString();

    res.status(200).json({
      status: 'success',
      data: JSON.parse(allRequests),
    });
  }
);

const getOneRequest: RequestHandler<{ orgId: string; reqId: string }> =
  catchAsync(async (req, res, next) => {
    const requestId = req.params.reqId;
    const contract = getPharmaceuticalTransferContract(req);

    const allRequests = (
      await contract.submitTransaction('getOneRequest', requestId)
    ).toString();

    res.status(200).json({
      status: 'success',
      data: JSON.parse(allRequests),
    });
  });

const initiateTransfer: RequestHandler<{ orgId: string }> = catchAsync(
  async (req, res, next) => {
    const { requestId, latitude, longitude, sentItems } = req.body as {
      requestId: string;
      latitude: number;
      longitude: number;
      sentItems: {
        [catalogueId: string]: {
          assetId: string;
          batchSize?: number;
          quantity: number;
          quantityType: string;
        }[];
      }[];
    };
    const sentDate = new Date().toISOString();
    const packageId = uuidv4();

    if (!requestId)
      return next(new AppError('No request ID present in the body', 400));

    const contract = getPharmaceuticalTransferContract(req);

    await contract.submitTransaction(
      'initiateTransfer',
      requestId,
      packageId,
      JSON.stringify(sentItems),
      sentDate,
      JSON.stringify([latitude, longitude])
    );

    res.status(201).json({
      status: 'success',
      message: 'Transfer made successfully',
    });
  }
);

const getAllTransfers: RequestHandler<{ orgId: string }> = catchAsync(
  async (req, res, next) => {
    const contract = getPharmaceuticalTransferContract(req);

    const allTransfers = (
      await contract.submitTransaction('getAllTransfers')
    ).toString();

    res.status(200).json({
      status: 'success',
      data: JSON.parse(allTransfers),
    });
  }
);

const getOneTransfer: RequestHandler<{ orgId: string; reqId: string }> =
  catchAsync(async (req, res, next) => {
    const requestId = req.params.reqId;
    const contract = getPharmaceuticalTransferContract(req);

    const allRequests = (
      await contract.submitTransaction('getOneTransfer', requestId)
    ).toString();

    res.status(200).json({
      status: 'success',
      data: JSON.parse(allRequests),
    });
  });

export {
  makeRequest,
  initiateTransfer,
  getAllRequests,
  getOneRequest,
  getAllTransfers,
  getOneTransfer,
};
