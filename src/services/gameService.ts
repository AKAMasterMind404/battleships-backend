import { Service, Inject, Container } from 'typedi';
import HelperService from '../utils/helpers';
import { GameCreateDto, GameGetDto } from '../interfaces/IGame';

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
}