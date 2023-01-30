import { RequestHandler } from 'express';
import { Contract } from 'fabric-network';
import catchAsync from '../../utils/catchAsync';

const readAsset: RequestHandler<{ id: string }> = catchAsync(
  async (req, res, next) => {
    const assetId = req.params.id;

    const contract = req.network?.getContract(
      process.env.HLF_CHAINCODE_NAME as string,
      'AssetTransferContract'
    ) as Contract;

    const asset = (
      await contract.submitTransaction('ReadAsset', assetId)
    ).toString();

    res.status(200).send({
      status: 'success',
      data: JSON.parse(asset),
    });
  }
);

export { readAsset };
