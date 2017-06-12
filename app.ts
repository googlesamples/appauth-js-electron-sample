import { AuthFlow, AuthStateEmitter } from './flow';
import { log } from './logger';

const SIGN_IN = 'Sign-In';
const SIGN_OUT = 'Sign-Out';

export class App {
  private authFlow: AuthFlow = new AuthFlow();
  private handleSignIn = document.querySelector('#handle-sign-in')!;

  constructor() {
    this.handleSignIn.textContent = SIGN_IN;

    this.handleSignIn.addEventListener('click', (event) => {
      if (this.handleSignIn.textContent === SIGN_IN) {
        this.signIn();
      } else if (this.handleSignIn.textContent === SIGN_OUT) {
        this.signOut();
      }
      event.preventDefault();
    });

    this.authFlow.authStateEmitter.on(AuthStateEmitter.ON_AUTHORIZATION_RESPONSE, () => {
      this.handleSignIn.textContent = SIGN_OUT;
    });
  }

  signIn(username?: string): Promise<void> {
    if (!this.authFlow.loggedIn()) {
      return this.authFlow.fetchServiceConfiguration()
        .then(() => this.authFlow.makeAuthorizationRequest(username));
    } else {
      return Promise.resolve();
    }
  }

  signOut() {
    this.authFlow.signOut();
    this.handleSignIn.textContent = SIGN_IN;
  }

}

log('Init complete');
const app = new App();
