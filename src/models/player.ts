import { IPlayer } from '../interfaces/IPlayer';
import mongoose from 'mongoose';

const Player = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please enter a full name'],
      unique: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please enter a password'],
    },
    sessionToken: {
      type: String
    }
  },
  { collection: 'players', timestamps: true },
);

export default mongoose.model<IPlayer & mongoose.Document>('playerModel', Player);
