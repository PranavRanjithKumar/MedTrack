import { RequestHandler } from 'express';
import { Contract } from 'fabric-network';
import catchAsync from '../../utils/catchAsync';

const readAsset: RequestHandler = catchAsync(async (req, res, next) => {
  const assetId = (req.body as { id: string }).id;

  const contract = req.network?.getContract(
    process.env.HLF_CHAINCODE_NAME as string,
    'AssetTransferContract'
  ) as Contract;

  const asset = (
    await contract.submitTransaction('ReadAsset', assetId)
  ).toString();
  console.log(JSON.parse(asset));

  res.status(200).send({
    status: 'success',
    data: asset,
  });
});

export { readAsset };
