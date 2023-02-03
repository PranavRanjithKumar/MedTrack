import { Schema, Types, model, PopulatedDoc, Document } from 'mongoose';
import { IDrug } from './drugModel';
import { IOrganization } from './organizationModel';

export interface ICatalogue {
  code: string;
  unitQuantity: number;
  unitQuantityType: string;
  drug: PopulatedDoc<Document<Types.ObjectId> & IDrug>;
  organization: PopulatedDoc<Document<Types.ObjectId> & IOrganization>;
}

// 2. Create a Schema corresponding to the document interface.
const catalogueSchema = new Schema<ICatalogue>({
  code: {
    type: String,
    trim: true,
    required: [true, 'Please provide unique code for this catalogue item'],
    uppercase: true,
    unique: true,
  },
  unitQuantity: {
    type: Number,
    required: [true, 'Please provide the quantity of an unit'],
  },
  unitQuantityType: {
    type: String,
    required: [true, 'Please provide the quantity type of an unit'],
  },
  drug: {
    type: Schema.Types.ObjectId,
    ref: 'Drug',
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
  },
});

catalogueSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'drug',
    select: 'name code description',
  }).populate({
    path: 'organization',
    select: 'name code type',
  });
  next();
});

const Catalogue = model<ICatalogue>('Catalogue', catalogueSchema);

export default Catalogue;
