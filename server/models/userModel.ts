/* eslint-disable object-shorthand */
import { Schema, model, Model, Types, Document, PopulatedDoc } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import { IOrganization } from './organizationModel';

export interface IUser {
  name: string;
  organization: PopulatedDoc<Document<Types.ObjectId> & IOrganization>;
  email: string;
  role: string;
  password?: string;
  passwordConfirm?: string;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  active?: boolean;
}

export interface IUserMethods {
  correctPassword(
    candidatePassword: string,
    password: string
  ): Promise<boolean>;
}

type UserModel = Model<IUser, {}, IUserMethods>;

// 2. Create a Schema corresponding to the document interface.
const userSchema = new Schema<IUser, UserModel, IUserMethods>({
  name: {
    type: String,
    required: [true, 'Please provide an username.'],
    trim: true,
    unique: true,
    validate: {
      validator: (val: string) => validator.isLength(val, { min: 3, max: 40 }),
      message: 'Username should be of length from 3 to 40.',
    },
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'User must have an organization ID'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (val: string) => validator.isEmail(val),
      message: 'Please provide a valid email.',
    },
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'manager', 'employee', 'user'],
      message: `User role should be either 'admin', 'manager', 'employee' or 'user'`,
    },
    default: 'employee',
  },
  password: {
    type: String,
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  password: string
) {
  const isSame: boolean = await bcrypt.compare(candidatePassword, password);
  return isSame;
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password as string, 12);
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'organization',
    select: 'name type',
  });
  next();
});

// 3. Create a Model.
const User = model<IUser, UserModel>('User', userSchema);

export default User;
