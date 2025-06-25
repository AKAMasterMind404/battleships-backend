const Hashids = require('hashids/cjs');
import jwt from 'jsonwebtoken';
import { Service, Inject } from 'typedi';
import config from '../config';

@Service()
export default class HelperService {

  private hashids: any;
  private hashIdsObj: any;

  constructor(@Inject('logger') private logger) {
    this.hashids = {
      salt: 'this is my salt',
      minHashLength: 10,
      alphabet: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890',
    };

    this.hashIdsObj = new Hashids(this.hashids.salt, this.hashids.minHashLength, this.hashids.alphabet);
  }

  public static validatePayload(reqBody: any): void {
    for (const key in reqBody) {
      if (Object.prototype.hasOwnProperty.call(reqBody, key)) {
        const element = reqBody[key];
        if (element == undefined) {
          console.debug("Null values found with:", key, element);
          throw new Error(`Null values found with:${key}, ${element}`);
        }
      }
    }
  }

  public generateJwtForPayload(payload: object): string {
    const plainPayload = typeof payload === 'object' && 'toObject' in payload
      ? (payload as any).toObject()
      : payload;

    const token = jwt.sign(plainPayload, config.jwtSecret, { expiresIn: '9999999s' });
    return token;
  }

  public validatedEncodedPassword(pwd: string) {
    if (pwd.trim().length < 6) throw new Error('Password length must be atleast 6 characters long!');
    const encoded = HelperService.base64EncodeString(pwd);
    return encoded;
  }

  public static shuffleRandomly(positions: string[]) {
    return positions.sort(() => 0.5 - Math.random())
  }

  public static getRandomItem(items: any[]) {
    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
  }

  public static base64EncodeString(inputString: string): string {
    const binaryData = Buffer.from(inputString, 'utf-8');
    const base64String = binaryData.toString('base64');
    return base64String;
  }

  public static base64DecodeString(base64String: string): string {
    const binaryData = Buffer.from(base64String, 'base64');
    const decodedString = binaryData.toString('utf-8');
    return decodedString;
  }

  isNumber = function isNumber(a) {
    const value = Number(a);
    return typeof value === 'number' && isFinite(value);
  };

  public formatFileName(fileName: string) {
    //remove special chars
    if (!fileName) {
      return fileName;
    }
    let str: string = null;
    str = fileName.replace(/\s+/g, '');
    str = str.replace(/[^0-9a-zA-Z._/+/-/*/://]/ig, "-");

    return str;
  }

  public formatFolderName(firstName: string, lastName: string, contactGuId: string) {
    const contactInfo: string = `${this.capitalizeFirstLetter(firstName.trim())}-${this.capitalizeFirstLetter(lastName.trim())}-${contactGuId}`
    return contactInfo;
  }

  public formatOwnerName(firstName: string, lastName: string) {
    const ownerName: string = `${this.capitalizeFirstLetter(firstName.trim())} ${this.capitalizeFirstLetter(lastName.trim())}`
    return ownerName;
  }

  public capitalizeFirstLetter(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  public static getHeaders(): any {
    return {
      headers: {
        'Content-Type': 'application/json'
      },
    };
  }

  public getTokenFromHeader(req: any) {
    /**
     * @TODO Edge and Internet Explorer do some weird things with the headers
     * So I believe that this should handle more 'edge' cases ;)
     */
    if (
      (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer')
    ) {
      return req.headers.authorization.split(' ')[1];
    }
    return null;
  }


  public decodeHash(guId: any): any {
    if (guId != undefined && guId != "") {
      if (isNaN(guId)) {
        return guId ? this.hashIdsObj.decode(guId)[0] : '';
      } else {
        return guId;
      }
    } else {
      return guId;
    }
  }

  public encodeHash(guId: any): any {
    if (guId != undefined && guId != "") {
      return this.isNumber(guId) ? this.hashIdsObj.encode(guId) : guId;
    } else {
      return "";
    }
  }

}
