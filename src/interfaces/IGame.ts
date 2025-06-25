export interface IGame {
    _id: any,
    status: number;
    position: number;
    ai?: string;
    player1: string;
    player2: string;
    p1Shots: string[];
    p2Shots: string[];
    p1Ships: string[];
    p2Ships: string[];
}

export class GameCreateDto {
    ships: string[];
    player1: string;
    ai: string;
}

export class GamePlayDto {
    id: string;
    shot: string;
    player: string;
}

export class GameGetDto {
    id: string;
    max: number;
    page: number;
    player: string;
}