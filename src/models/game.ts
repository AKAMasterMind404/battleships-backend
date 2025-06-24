import mongoose from 'mongoose';
import { IGame } from '../interfaces/IGame';

const Game = new mongoose.Schema(
  {
    winner: {
      type: String,
      default: null
    },
    player1: {
      type: String,
      required: true,
    },
    player2: {
      type: String
    },
    turn: {
      type: String,
      required: true,
    },
    p1Ships: {
      type: String,
      required: true,
    },
    p2Ships: {
      type: String,
      default: ''
    },
    p1Shots: {
      type: String,
      default: ''
    },
    p2Shots: {
      type: String,
      default: ''
    },
  },
  { collection: 'games', timestamps: true },
);

export default mongoose.model<IGame & mongoose.Document>('gameModel', Game);
