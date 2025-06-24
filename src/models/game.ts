import mongoose from 'mongoose';
import { IGame } from '../interfaces/IGame';

const Game = new mongoose.Schema(
  {
    status: {
      type: Number,
      default: null
    },
    position: {
      type: Number,
      default: 1
    },
    player1: {
      type: String,
      required: true
    },
    player2: {
      type: String,
      default: ''
    },
    p1Shots: {
      type: Array,
      default: []
    },
    p2Shots: {
      type: Array,
      default: []
    },
    p1Ships: {
      type: Array,
      required: true
    },
    p2Ships: {
      type: Array,
      default: []
    },
  },
  { collection: 'games', timestamps: true },
);

export default mongoose.model<IGame & mongoose.Document>('gameModel', Game);
