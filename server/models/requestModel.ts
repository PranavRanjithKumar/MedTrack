import { Schema, Types, model, PopulatedDoc, Document } from 'mongoose';
import { IDrug } from './drugModel';
import { IOrganization } from './organizationModel';

export interface IRequest {
  type: string;
  name: string;
  description: string;
  ingrediants?: Types.Array<PopulatedDoc<Document<Types.ObjectId> & IDrug>>;
  requestedOrganization: PopulatedDoc<Document<Types.ObjectId> & IOrganization>;
  requestedAt: Date;
  approved: boolean;
  approvedOrganization?: PopulatedDoc<Document<Types.ObjectId> & IOrganization>;
  approvedAt?: Date;
}

// 2. Create a Schema corresponding to the document interface.
const requestSchema = new Schema<IRequest>({
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
  requestedOrganization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
  },
  requestedAt: Schema.Types.Date,
  approvedOrganization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
  },
  approvedAt: Schema.Types.Date,
  approved: {
    type: Boolean,
    default: false,
  },
});

requestSchema.pre('save', function (next) {
  if (!this.isNew) return next();
  this.requestedAt = new Date(Date.now());
  next();
});

requestSchema.pre('findOne', function (next) {
  this.select(
    '+requestedOrganization +approved +approvedAt +approvedOrganization'
  )
    .populate({
      path: 'requestedOrganization',
      select: 'name type',
    })
    .populate({
      path: 'approvedOrganization',
      select: 'name type',
    });
  next();
});

// 3. Create a Model.
const Request = model<IRequest>('Request', requestSchema);

export default Request;
