import { Schema, Types, model, PopulatedDoc, Document } from 'mongoose';

export interface IDrug {
  type: string;
  name: string;
  description: string;
  code: string;
  ingrediants?: Types.Array<PopulatedDoc<Document<Types.ObjectId> & IDrug>>;
}

// 2. Create a Schema corresponding to the document interface.
const drugSchema = new Schema<IDrug>({
  type: {
    type: String,
    required: [true, 'Please provide a type.'],
    enum: {
      values: ['raw-material', 'drug'],
      message: `Type should be 'raw-material' or 'drug'.`,
    },
  },
  name: {
    type: String,
    required: [true, 'Please provide raw-material / drug name'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Please assign a raw-material / drug code'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
  },
  ingrediants: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Drug',
    },
  ],
});

drugSchema.pre('findOne', function (next) {
  this.populate({
    path: 'ingrediants',
    select: 'name code',
  });
  next();
});

// 3. Create a Model.
const Drug = model<IDrug>('Drug', drugSchema);

export default Drug;
