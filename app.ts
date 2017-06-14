import { AuthFlow, AuthStateEmitter } from './flow';
import { log } from './logger';

const SIGN_IN = 'Sign-In';
const SIGN_OUT = 'Sign-Out';

interface SnackBarOptions {
  message: string;
  timeout?: number;
  actionHandler?: (event: any) => void;
  actionText?: string;
}

interface UserInfo {
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export class App {
  private authFlow: AuthFlow = new AuthFlow();
  private userInfo: UserInfo | null = null;

  private handleSignIn =
  document.querySelector('#handle-sign-in') as HTMLElement;

  private fetchUserInfo =
  document.querySelector('#handle-user-info') as HTMLElement;

  private userCard = document.querySelector('#user-info') as HTMLElement;

  private userProfileImage =
  document.querySelector('#user-profile-image') as HTMLImageElement;

  private userName = document.querySelector('#user-name') as HTMLElement;

  private snackbarContainer: any =
  document.querySelector('#appauth-snackbar') as HTMLElement;

  constructor() {
    this.initializeUi();
    this.handleSignIn.addEventListener('click', (event) => {
      if (this.handleSignIn.textContent === SIGN_IN) {
        this.signIn();
      } else if (this.handleSignIn.textContent === SIGN_OUT) {
        this.signOut();
      }
      event.preventDefault();
    });

    this.fetchUserInfo.addEventListener('click', () => {
      this.authFlow.performWithFreshTokens().then(accessToken => {
        let request =
          new Request('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: new Headers({ 'Authorization': `Bearer ${accessToken}` }),
            method: 'GET',
            cache: 'no-cache'
          });

        fetch(request)
          .then(result => result.json())
          .then(user => {
            log('User Info ', user);
            this.userInfo = user;
            this.updateUi();
          })
          .catch(error => {
            log('Something bad happened ', error);
          });
      });
    });

    this.authFlow.authStateEmitter.on(
      AuthStateEmitter.ON_TOKEN_RESPONSE, () => {
        this.updateUi();
      });
  }

  signIn(username?: string): Promise<void> {
    if (!this.authFlow.loggedIn()) {
      return this.authFlow.fetchServiceConfiguration().then(
        () => this.authFlow.makeAuthorizationRequest(username));
    } else {
      return Promise.resolve();
    }
  }

  private initializeUi() {
    this.handleSignIn.textContent = SIGN_IN;
    this.fetchUserInfo.style.display = 'none';
    this.userCard.style.display = 'none';
  }

  // update ui post logging in.
  private updateUi() {
    this.handleSignIn.textContent = SIGN_OUT;
    this.fetchUserInfo.style.display = '';
    if (this.userInfo) {
      this.userProfileImage.src = `${this.userInfo.picture}?sz=96`;
      this.userName.textContent = this.userInfo.name;
      this.showSnackBar(
        { message: `Welcome ${this.userInfo.name}`, timeout: 4000 });
      this.userCard.style.display = '';
    }
  }

  private showSnackBar(data: SnackBarOptions) {
    this.snackbarContainer.MaterialSnackbar.showSnackbar(data);
  }

  signOut() {
    this.authFlow.signOut();
    this.userInfo = null;
    this.initializeUi();
  }
}

log('Init complete');
const app = new App();
