import mongoose from 'mongoose';
import { ISession } from '../interfaces/ISession';

const Session = new mongoose.Schema(
  {
    _id: {
      type: String,
      unique: true,
    },
    user_id: {
      type: String,
    },
    email: {
      type: String,
    },
    token: {
      type: String,
    },
    is_signed_in: {
      type: Boolean,
    },
  },
  { collection: 'session', timestamps: true },
);

export default mongoose.model<ISession & mongoose.Document>('sessionModel', Session);
