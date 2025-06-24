import { Service, Inject, Container } from 'typedi';
import HelperService from '../utils/helpers';
import { GameCreateDto, GameGetDto, GamePlayDto, IGame } from '../interfaces/IGame';
import { Document } from 'mongoose';

@Service()
export default class GameService {
    private helperService: HelperService;

    constructor(
        @Inject('logger') private logger,
        @Inject('gameModel') private gameModel: Models.gameModel,
    ) {
        this.helperService = Container.get(HelperService);
    }

    public buildGameGetDto(req: any): GameGetDto {
        const dto = new GameGetDto();
        dto.id = req.params.id;
        dto.max = req.body.hasOwnProperty('max') ? +req.body.max : 10;
        dto.page = req.body.hasOwnProperty('page') ? +req.body.page : 0;
        return dto;
    }

    public buildGamePlayDto(req: any): GamePlayDto {
        const dto = new GamePlayDto();
        dto.id = req.params.game_id;
        dto.shot = req.body.shot;
        dto.player = req.claims._id;

        if (!dto.id) {
            throw new Error("Game Id required to play!");
        }

        if (!dto.shot) {
            throw new Error("Choose a shot to play!");
        }

        return dto;
    }

    public buildGameCreateDto(req: any): GameCreateDto {
        const dto = new GameCreateDto();
        dto.player1 = req.claims._id;
        dto.ships = req.body.hasOwnProperty('ships') ? req.body.ships : undefined;
        dto.ai = req.body.hasOwnProperty('ai') ? req.body.ai : undefined;

        if (dto.ai && !(['random', 'perfect'].includes(dto.ai))) {
            throw new Error("Only 'random' and 'perfect' parameters allowed as options for A.I.!");
        }

        return dto;
    }

    public async createNewOrMatchGame(dto: GameCreateDto): Promise<{ data: any }> {
        try {
            const gameObject = { player1: dto.player1, p1Ships: dto.ships };

            let game;
            let isNew = 0;
            const openGame = await this.gameModel.findOne({ player2: null, player1: { $ne: gameObject.player1 } });
            if (openGame) {
                game = await this.gameModel.findByIdAndUpdate(openGame._id, {
                    player2: gameObject.player1,
                    p2Ships: gameObject.p1Ships
                });
            } else {
                const newGame = await this.gameModel.create(gameObject);
                game = (newGame as any).toObject();
                isNew = 1;
            }

            return { data: { ...game, g: isNew } };
        } catch (error) {
            throw Error('Could not create game!');
        }
    }

    public async playShot(dto: GamePlayDto): Promise<{ data: any }> {
        try {
            const game = await this.gameModel.findById(dto.id);
            const { message, sunk_ship, won } = this.getGameResult(game, dto);
            const { updateBody } = this.getUpdateBody(game, dto, won);

            const updatedGame = await this.gameModel.findByIdAndUpdate(
                dto.id,
                updateBody,
                { new: true }
            );

            return { data: { message, sunk_ship, won } }
        } catch (error) {
            throw new Error(error);
        }
    }

    public async getGameData(dto: GameGetDto): Promise<{ data: any }> {
        try {
            let data;
            if (dto.id) {
                data = await this.gameModel.findById(dto.id);
            } else {
                data = await this.gameModel.find().skip(dto.max * dto.page).limit(dto.max);
            }

            return { data };
        } catch (error) {
            throw Error('Trouble fetching games!');
        }
    }

    private getUpdateBody(game: IGame, dto: GamePlayDto, won: any): { updateBody: any; } {
        const updateBody: any = {};
        if (game.player1 === dto.player) {
            updateBody.$push = { p1Shots: dto.shot };
        } else {
            updateBody.$push = { p2Shots: dto.shot };
        }
        updateBody.$set = { position: game.position == 1 ? 2 : 1 };
        if (won) {
            updateBody.$set = { status: game.player1 === dto.player ? 1 : 2 };
        }

        return { updateBody };
    }

    private getGameResult(game: IGame, dto: GamePlayDto): { message: any; sunk_ship: any; won: any; } {
        if (game.player1 != dto.player && game.player2 != dto.player) {
            throw new Error('You are not a part of this game!');
        }

        if (game.status != null) {
            throw new Error("This game is already over!");
        }

        const playerPosition = game.player1 == dto.player ? 1 : 2;
        if (playerPosition != game.position) {
            throw new Error("Not your turn");
        }

        const playerShots = playerPosition == 1 ? game.p1Shots : game.p2Shots;
        if (playerShots.includes(dto.shot)) {
            throw new Error("You have already placed a shot here!");
        }

        const enemyShips = playerPosition == 1 ? game.p2Ships : game.p1Ships;
        const sunk_ship = enemyShips.includes(dto.shot);

        let sunkCount = 0;
        for (let i = 0; i < enemyShips.length; i++) {
            const currShip = enemyShips[i];
            if (playerShots.includes(currShip) || dto.shot == currShip) {
                sunkCount++;
            }
        }

        const won = sunkCount == enemyShips.length;
        const message = sunk_ship ? "Shot Played Successfully!" : "Shot Missed!";

        return { message, sunk_ship, won };
    }
}