import { RequestHandler } from 'express';
import Drug from '../../models/drugModel';
import AppError from '../../utils/AppError';
import catchAsync from '../../utils/catchAsync';

const getDrug: RequestHandler<{ id: string }> = catchAsync(
  async (req, res, next) => {
    const drugId = req.params.id;
    const drug = await Drug.findById(drugId);

    if (!drug) return next(new AppError('Drug not found!', 404));

    res.status(200).json({
      status: 'success',
      data: drug,
    });
  }
);

const getAllDrugs: RequestHandler = catchAsync(async (req, res, next) => {
  const drugs = await Drug.find();

  res.status(200).json({
    status: 'success',
    data: drugs,
  });
});

export { getDrug, getAllDrugs };
