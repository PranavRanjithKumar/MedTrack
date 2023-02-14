import { RequestHandler } from 'express';
import Drug from '../../models/drugModel';
import catchAsync from '../../utils/catchAsync';
import AppError from '../../utils/AppError';
import Catalogue from '../../models/catalogueModel';

const addDrugToCatalogue: RequestHandler<{ orgId: string }> = catchAsync(
  async (req, res, next) => {
    const orgId = req.user?.organization;

    // Retrieving org type to check if the user adds the right kinda medicine
    let orgType = '';
    if (req.user && req.user.organization && 'type' in req.user.organization) {
      orgType = req.user.organization.type as string;
    }

    if (orgType === 'distributor') return next();

    const {
      code,
      unitQuantity,
      unitQuantityType,
      drug: drugId,
    } = req.body as {
      drug: string;
      code: string;
      unitQuantity: string;
      unitQuantityType: string;
    };

    // Check if a catalogue Item with this code already exists
    // in the suppliers' or manufacturers' catalogue
    const aggregationPipeline = [
      {
        $lookup: {
          from: 'organizations',
          localField: 'organization',
          foreignField: '_id',
          as: 'organization',
        },
      },
      {
        $unwind: {
          path: '$organization',
        },
      },
      {
        $match: {
          'organization.type': {
            $in: ['supplier', 'manufacturer'],
          },
          code,
        },
      },
    ];

    const catalogueItemAlreadyExists = await Catalogue.aggregate(
      aggregationPipeline
    );

    if (catalogueItemAlreadyExists.length > 0)
      return next(new AppError('Catalogue item code already taken!', 400));

    // Check if the drug actually exists
    const drugWithId = await Drug.findById(drugId);

    if (!drugWithId) return next(new AppError('Drug not found!', 400));

    // Supplier organizations should only be able to add raw materials &
    // manufacturer organizations should only be able to add drugs
    if (
      (orgType === 'supplier' && drugWithId.type !== 'raw-material') ||
      (orgType === 'manufacturer' && drugWithId.type !== 'drug')
    )
      return next(
        new AppError('Cannot add this type of drug to your catalogue', 400)
      );

    const catalogue = await Catalogue.create({
      code,
      unitQuantity,
      unitQuantityType,
      drug: drugId,
      organization: orgId,
    });

    res.status(201).json({
      status: 'success',
      data: catalogue,
    });
  }
);

const getCatalogueForOrganization: RequestHandler<{ orgId: string }> =
  catchAsync(async (req, res, next) => {
    const { orgId } = req.params;

    const catalogueItems = await Catalogue.find({ organization: orgId });

    res.status(200).json({
      status: 'success',
      data: catalogueItems,
    });
  });

const addCatalogueItemToCatalogue: RequestHandler<{
  orgId: string;
  catalogueId: string;
}> = catchAsync(async (req, res, next) => {
  const { orgId, catalogueId } = req.params;

  const catalogueItem = await Catalogue.findById(catalogueId);

  if (!catalogueItem)
    return next(new AppError('No catalogue item found with this ID', 400));

  const catalogue = await Catalogue.create({
    code: catalogueItem.code,
    drug: catalogueItem.drug,
    unitQuantity: catalogueItem.unitQuantity,
    unitQuantityType: catalogueItem.unitQuantityType,
    organization: orgId,
  });

  res.status(201).json({
    status: 'success',
    data: catalogue,
  });
});

const getCatalogueItem: RequestHandler<{ orgId: string; catalogueId: string }> =
  catchAsync(async (req, res, next) => {
    const { orgId, catalogueId } = req.params;

    const catalogueItem = await Catalogue.findOne({
      organization: orgId,
      _id: catalogueId,
    });

    if (!catalogueItem)
      return next(new AppError('No catalogue Item found!', 404));

    res.status(200).json({
      status: 'success',
      data: catalogueItem,
    });
  });

export {
  addDrugToCatalogue,
  getCatalogueForOrganization,
  getCatalogueItem,
  addCatalogueItemToCatalogue,
};
