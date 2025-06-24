export interface IPlayer {
    _id: string;
    username: string;
    password: string;
}

export class PlayerCreateDto {
    _id: string;
    username: string;
    password: string;
}

export class AuthDto {
    username: string;
    password: string;
    token: string;
}