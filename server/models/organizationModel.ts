/* eslint-disable object-shorthand */
import { Schema, model } from 'mongoose';
import validator from 'validator';

export interface IOrganization {
  name: string;
  code: string;
  email: string;
  type: string;
  role?: string;
  address: string;
  city: string;
  state: string;
}

// 2. Create a Schema corresponding to the document interface.
const organizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: [true, 'Please provide an organization name.'],
    trim: true,
    validate: {
      validator: (val: string) => validator.isLength(val, { min: 3, max: 40 }),
      message: 'Organization name should be of length from 3 to 40.',
    },
  },
  code: {
    type: String,
    required: [true, 'Please provide an organization code.'],
    unique: true,
    trim: true,
    validate: {
      validator: (val: string) => validator.isLength(val, { min: 3, max: 10 }),
      message: 'Organization code should be of length from 3 to 10.',
    },
  },
  email: {
    type: String,
    required: [true, 'Please provide an organization email.'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (val: string) => validator.isEmail(val),
      message: 'Please provide a valid organization email.',
    },
  },
  type: {
    type: String,
    required: [true, 'Please provide an organization type.'],
    enum: {
      values: [
        'supplier',
        'manufacturer',
        'distributor',
        'retailer',
        'consumer',
      ],
      message: `Organization type should be either of these: 'supplier',
      'manufacturer',
      'distributor',
      'retailer',
      'consumer'`,
    },
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'user'],
      message: `Organization role should be either 'admin' or 'user'`,
    },
    default: 'user',
  },
  address: {
    type: String,
    required: [true, 'Please provide organization address.'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'Please provide organization city.'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'Please provide organization state location .'],
    trim: true,
  },
});

// 3. Create a Model.
const Organization = model<IOrganization>('Organization', organizationSchema);

export default Organization;
