import { AuthFlow } from './flow';
import { AuthorizationServiceConfiguration } from '@openid/appauth/built/authorization_service_configuration';

export class App {
  private authFlow: AuthFlow = new AuthFlow();

  signIn(username?: string): Promise<void> {
    if (!this.authFlow.loggedIn()) {
      return this.authFlow.fetchServiceConfiguration()
        .then(() => this.authFlow.makeAuthorizationRequest(username));
    } else {
      return Promise.resolve();
    }
  }

}
