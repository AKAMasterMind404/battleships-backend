import { Container } from 'typedi';
import { Logger } from 'winston';

export default class UsernameSequenceJob {
  public async handler(job, done): Promise<void> {
    const Logger: Logger = Container.get('logger');
    try {
      Logger.debug('✌️ Username Sequence Job triggered!');
      const { username, name }: { [key: string]: string } = job.attrs.data;
      //const mailerServiceInstance = Container.get(MailerService);
      //await mailerServiceInstance.SendWelcomeUsername(username);
      done();
    } catch (e) {
      Logger.error('🔥 Error with Username Sequence Job: %o', e);
      done(e);
    }
  }
}
