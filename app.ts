import { AuthFlow } from './flow';
import { AuthorizationServiceConfiguration } from '@openid/appauth/src/authorization_service_configuration';

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

// export app
const app = new App();
const anyWindow = window as any;
anyWindow['App'] = app;
