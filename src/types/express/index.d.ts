import { Document, Model } from 'mongoose';
import { type } from 'os';
import { ITest } from '../../interfaces/ITest';
import { IPlayer } from '../../interfaces/IPlayer';
import { ISession } from '../../interfaces/ISession';

declare global {
  namespace Express {
    export interface Request {
    }    
  }

  namespace Models {
    export type testModel = Model<ITest & Document>
    export type playerModel = Model<IPlayer & Document>
    export type sessionModel = Model<ISession & Document>
  }
}
