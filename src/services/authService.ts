import { Service, Inject, Container } from 'typedi';
import HelperService from '../utils/helpers';
import { decode } from 'jwt-simple';
import config from '../config';
import { AuthDto, PlayerCreateDto } from '../interfaces/IPlayer';

@Service()
export default class AuthService {
    private helperService: HelperService;

    constructor(
        @Inject('logger') private logger,
        @Inject('sessionModel') private sessionModel: Models.sessionModel,
        @Inject('playerModel') private playerModel: Models.playerModel,
    ) {
        this.helperService = Container.get(HelperService);
    }

    public buildLoggedInAuthDto(req: any): AuthDto {
        const dto = {
            token: req.claims.token
        } as AuthDto;
        return dto;
    }

    public buildAuthDto(req: any, isLogout: boolean): AuthDto {
        const dto = {
            password: req.body.hasOwnProperty('password') ? HelperService.base64EncodeString(req.body.password) : undefined,
            username: req.body.hasOwnProperty('username') ? req.body.username : undefined,
            token: req.body.token // Middleware throws error while decrypting, hence passed through body
        } as AuthDto;

        if (!dto.username) {
            throw new Error('Username required!');
        }

        if (!dto.password || dto.password.trim().length < 6) {
            throw new Error("Enter a password longer than 6 characters!");
        }

        return dto;
    }

    public async loginWithToken(dto: AuthDto) {
        const session = await this.getSessionWithToken(dto.token);
        let data;
        if (session) {
            data = "User is logged in!";
        } else {
            throw new Error("Session token not found or expired!");
        }

        return { data };
    }

    public async registerWithUsernameAndPassword(dto: AuthDto) {
        try {
            const newUser = await this.playerModel.create({
                username: dto.username,
                password: dto.password
            });

            return newUser;
        } catch (error) {
            throw error;
        }
    }

    public async getAll(): Promise<{ data: any[] }> {
        const data = await this.sessionModel.find();
        return { data };
    }

    public async loginWithUsernameAndPassword(dto: AuthDto) {
        let data = await this.getUserWithUsernameAndPassword(dto);
        const userData = (data as any).toObject();
        const existingSessionToken = await this.getExistingUserSession(userData);

        let token = undefined;
        if (existingSessionToken) {
            token = existingSessionToken;
            this.logger.info('Existing session token found ....');
        } else {
            this.logger.info('Generating new session token ....');
            const payload = this.helperService.generateJwtForPayload(userData);
            const newToken = await this.createSessionWithUserData({ ...userData, token: payload } as PlayerCreateDto);
            token = newToken.token;
        }

        return token;
    }


    public async logout(token: string) {
        try {
            const deletedSession = await this.sessionModel.deleteOne({ token })
            if (deletedSession.deletedCount == 0) {
                throw new Error("Logout Failed - Token not found! User likely logged out already!");
            }

            this.logger.info('LOG OUT IS SUCCESSFUL!');
            return { "data": "Logout successful!" };
        } catch (error) {
            throw error;
        }
    }

    private async getSessionWithToken(token: string) {
        const existing = await this.sessionModel.findOne({ token });
        if (!existing) {
            this.logger.info('Token not found!');
            return null;
        }

        return existing;
    }

    private async getExistingUserSession(dto: PlayerCreateDto) {
        const existing = await this.sessionModel.findOne({ username: dto.username, _id: dto._id });

        if (!existing) return null;

        let token = existing.token;
        try {
            const isTokenExpired = decode(token, config.jwtSecret);
            this.logger.info('Existing session is UNEXPIRED. Returning....');
            // Checks if token is expired or not
        } catch (error) {
            this.logger.error('Existing session token EXPIRED!! Deleting from database!');
            await this.logout(token);
            token = null;
        }

        return token;
    }

    private async getUserWithUsernameAndPassword(dto: AuthDto) {
        const user = await this.playerModel.findOne({ username: dto.username, password: dto.password });
        if (!user) throw new Error("Username / Password combination incorrect!");

        return user as PlayerCreateDto;
    }

    private async createSessionWithUserData(dto: PlayerCreateDto) {
        try {
            const sessionToken = await this.sessionModel.create({ ...dto, is_signed_in: true });
            return sessionToken;
        } catch (error) {
            throw new Error('Could not login! Check existing session and logout before use!');
        }
    }
}