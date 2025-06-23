import { Router } from 'express';
import test from './routes/test';
import auth from './routes/auth';
// guaranteed to get dependencies
export default () => {
	const app = Router();
	test(app);
	auth(app);

	return app
}