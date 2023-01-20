import { RequestHandler } from 'express';
import Drug from '../../models/drugModel';
import catchAsync from '../../utils/catchAsync';
import AppError from '../../utils/AppError';
import Catalogue from '../../models/catalogueModel';

const addToCatalogue: RequestHandler<{ drugId: string }> = catchAsync(
  async (req, res, next) => {
    const { drugId } = req.params;

    const orgId = req.user?.organization;

    const { code, unitQuantity, unitQuantityType } = req.body as {
      code: string;
      unitQuantity: string;
      unitQuantityType: string;
    };

    if (!drugId) return next(new AppError('No ID found in the route!', 400));

    const drugWithId = await Drug.findById(drugId);

    if (!drugWithId) return next(new AppError('Drug not found!', 404));

    const catalogue = await Catalogue.create({
      code,
      unitQuantity,
      unitQuantityType,
      drug: drugId,
      organization: orgId,
    });

    res.status(201).json({
      status: 'message',
      data: catalogue,
    });
  }
);

const getCatalogueForOrganization: RequestHandler<{ orgId: string }> =
  catchAsync(async (req, res, next) => {
    const orgId = req.params.orgId ?? req.user?.organization;

    const catalogue = await Catalogue.find({ organization: orgId });

    res.status(200).json({
      status: 'message',
      data: catalogue,
    });
  });

const getCatalogueItem: RequestHandler<{ orgId: string; catalogueId: string }> =
  catchAsync(async (req, res, next) => {
    const { orgId, catalogueId } = req.params;

    const catalogueItem = await Catalogue.find({
      organization: orgId,
      _id: catalogueId,
    });

    if (!catalogueItem)
      return next(new AppError('No catalogue Item found!', 404));

    res.status(200).json({
      status: 'message',
      data: catalogueItem,
    });
  });

export { addToCatalogue, getCatalogueForOrganization, getCatalogueItem };
