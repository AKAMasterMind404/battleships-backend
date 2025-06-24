export interface IPlayer {
    _id: string;
    email: string;
    password: string;
}

export class PlayerCreateDto {
    _id: string;
    email: string;
    password: string;
}

export class AuthDto {
    email: string;
    password: string;
    token: string;
}