import { RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Catalogue from '../../models/catalogueModel';
import { IDrug } from '../../models/drugModel';
import { IOrganization } from '../../models/organizationModel';
import AppError from '../../utils/AppError';
import { getPharmaceuticalTransferContract } from '../../utils/appUtils';
import catchAsync from '../../utils/catchAsync';

const getInHouseAssets: RequestHandler<{ orgId: string }> = catchAsync(
  async (req, res, next) => {
    const contract = getPharmaceuticalTransferContract(req);

    const asset = (
      await contract.submitTransaction('getInHouseAssets')
    ).toString();

    res.status(200).send({
      status: 'success',
      data: JSON.parse(asset),
    });
  }
);

const getOutSourcedAssets: RequestHandler<{ orgId: string }> = catchAsync(
  async (req, res, next) => {
    const contract = getPharmaceuticalTransferContract(req);

    const asset = (
      await contract.submitTransaction('getOutSourcedAssets')
    ).toString();

    res.status(200).send({
      status: 'success',
      data: JSON.parse(asset),
    });
  }
);

const getAssetProvenance: RequestHandler = catchAsync(
  async (req, res, next) => {
    const contract = getPharmaceuticalTransferContract(req);

    const assetId = (req.body as { id: string }).id;

    const asset = (
      await contract.submitTransaction('getAssetProvenance', assetId)
    ).toString();

    res.status(200).send({
      status: 'success',
      data: JSON.parse(asset),
    });
  }
);

const storeAsset: RequestHandler<{ orgId: string }> = catchAsync(
  async (req, res, next) => {
    const contract = getPharmaceuticalTransferContract(req);

    let orgType;
    const { orgId } = req.params;
    const {
      code,
      manufacturingDate,
      expiryDate,
      latitude,
      quantity,
      longitude,
      constitution = undefined,
    } = req.body as {
      code: string;
      manufacturingDate: string;
      expiryDate: string;
      latitude: number;
      quantity: number;
      longitude: number;
      constitution: {
        assetId: string;
        catalogueId: string;
        quantity: number;
        quantityType: string;
      }[];
    };

    // Check if the user belongs to the organization
    if (orgId !== req.user?.organization?.id)
      return next(
        new AppError('Only organization members can store assets', 403)
      );

    // Check if the drug is available in their catalogue
    const drugInCatalogue = await Catalogue.findOne({
      organization: orgId,
      code,
    });

    if (!drugInCatalogue)
      return next(new AppError('Specified ID is not in your catalogue', 400));

    if (req.user && req.user.organization && 'type' in req.user.organization) {
      orgType = req.user.organization.type;
    }

    const asset = {
      id: '',
      name: (drugInCatalogue.drug as IDrug).name,
      docType: '',
      description: (drugInCatalogue.drug as IDrug).description,
      currentOwnerOrgType: (drugInCatalogue.organization as IOrganization).type,
      catalogueId: code,
      currentOwnerOrgId: drugInCatalogue.organization?.id,
      currentOwnerLocation: [latitude, longitude],
      quantityProduced: drugInCatalogue.unitQuantity,
      quantityType: drugInCatalogue.unitQuantityType,
      manufacturingDate,
      expiryDate,
      manufacturingOrgId: drugInCatalogue.organization?.id,
      manufacturingOrgLocation: [latitude, longitude],
    };

    if (orgType === 'supplier') {
      asset.docType = 'raw-material';

      let numberOfDrugs = quantity;
      const promises: Promise<Buffer>[] = [];

      while (numberOfDrugs) {
        numberOfDrugs -= 1;
        asset.id = uuidv4();
        promises.push(
          contract.submitTransaction('CreateRawMaterial', JSON.stringify(asset))
        );
      }

      await Promise.all(promises);
    } else if (orgType === 'manufacturer') {
      asset.docType = 'drug';
      asset.id = uuidv4();
      const drug = { constitution, batchSize: quantity, ...asset };

      await contract.submitTransaction('CreateDrug', JSON.stringify(drug));
    }

    res.status(201).json({
      status: 'success',
      message: 'Assets created successfully',
    });
  }
);
export {
  getOutSourcedAssets,
  getInHouseAssets,
  storeAsset,
  getAssetProvenance,
};
