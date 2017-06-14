import { AuthorizationRequest } from '@openid/appauth/built/authorization_request';
import { AuthorizationNotifier, AuthorizationRequestHandler, AuthorizationRequestResponse, BUILT_IN_PARAMETERS } from '@openid/appauth/built/authorization_request_handler';
import { AuthorizationResponse } from '@openid/appauth/built/authorization_response';
import { AuthorizationServiceConfiguration } from '@openid/appauth/built/authorization_service_configuration';
import { NodeBasedHandler } from '@openid/appauth/built/node_support/node_request_handler';
import { NodeRequestor } from '@openid/appauth/built/node_support/node_requestor';
import { GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_REFRESH_TOKEN, TokenRequest } from '@openid/appauth/built/token_request';
import { BaseTokenRequestHandler, TokenRequestHandler } from '@openid/appauth/built/token_request_handler';
import { TokenError, TokenResponse } from '@openid/appauth/built/token_response';
import EventEmitter = require('events');

import { log } from './logger';
import { StringMap } from '@openid/appauth/built/types';

export class AuthStateEmitter extends EventEmitter {
  static ON_TOKEN_RESPONSE = 'on_token_response';
}

/* the Node.js based HTTP client. */
const requestor = new NodeRequestor();

/* an example open id connect provider */
const openIdConnectUrl = 'https://accounts.google.com';

/* example client configuration */
const clientId =
  '511828570984-dhnshqcpegee66hgnp754dupe8sbas18.apps.googleusercontent.com';
const redirectUri = 'http://localhost:8000';
const scope = 'openid';
// TODO(rahulrav@): Figure out a way to get rid of this
const clientSecret = 'TyBOnDZtguEfaKDHAaZjRP7i';

export class AuthFlow {
  private notifier: AuthorizationNotifier;
  private authorizationHandler: AuthorizationRequestHandler;
  private tokenHandler: TokenRequestHandler;
  readonly authStateEmitter: AuthStateEmitter;

  // state
  private configuration: AuthorizationServiceConfiguration | null;

  private refreshToken: string | null;
  private accessTokenResponse: TokenResponse | null;

  constructor() {
    this.notifier = new AuthorizationNotifier();
    this.authStateEmitter = new AuthStateEmitter();
    this.authorizationHandler = new NodeBasedHandler();
    this.tokenHandler = new BaseTokenRequestHandler(requestor);
    // set notifier to deliver responses
    this.authorizationHandler.setAuthorizationNotifier(this.notifier);
    // set a listener to listen for authorization responses
    // make refresh and access token requests.
    this.notifier.setAuthorizationListener((request, response, error) => {
      log('Authorization request complete ', request, response, error);
      if (response) {
        this.makeRefreshTokenRequest(response.code)
          .then(result => this.performWithFreshTokens())
          .then(() => {
            this.authStateEmitter.emit(AuthStateEmitter.ON_TOKEN_RESPONSE);
            log('All Done.');
          })
      }
    });
  }

  fetchServiceConfiguration(): Promise<void> {
    return AuthorizationServiceConfiguration
      .fetchFromIssuer(openIdConnectUrl, requestor)
      .then(response => {
        log('Fetched service configuration', response);
        this.configuration = response;
      });
  }

  makeAuthorizationRequest(username?: string) {
    if (!this.configuration) {
      log('Unknown service configuration');
      return;
    }

    const extras: StringMap = { 'prompt': 'consent', 'access_type': 'offline' };
    if (username) {
      extras['login_hint'] = username;
    }

    // create a request
    const request = new AuthorizationRequest(
      clientId, redirectUri, scope, AuthorizationRequest.RESPONSE_TYPE_CODE,
      undefined /* state */, extras);

    log('Making authorization request ', this.configuration, request);

    this.authorizationHandler.performAuthorizationRequest(
      this.configuration, request);
  }

  private makeRefreshTokenRequest(code: string): Promise<void> {
    if (!this.configuration) {
      log('Unknown service configuration');
      return Promise.resolve();
    }
    // use the code to make the token request.
    let request = new TokenRequest(
      clientId, redirectUri, GRANT_TYPE_AUTHORIZATION_CODE, code, undefined,
      { 'client_secret': clientSecret });

    return this.tokenHandler.performTokenRequest(this.configuration, request)
      .then(response => {
        log(`Refresh Token is ${response.refreshToken}`);
        this.refreshToken = response.refreshToken;
        this.accessTokenResponse = response;
        return response;
      })
      .then(() => { });
  }

  loggedIn(): boolean {
    return !!this.accessTokenResponse && this.accessTokenResponse.isValid();
  }

  signOut() {
    // forget all cached token state
    this.accessTokenResponse = null;
  }

  performWithFreshTokens(): Promise<string> {
    if (!this.configuration) {
      log('Unknown service configuration');
      return Promise.reject('Unknown service configuration');
    }
    if (!this.refreshToken) {
      log('Missing refreshToken.');
      return Promise.resolve('Missing refreshToken.');
    }
    if (this.accessTokenResponse && this.accessTokenResponse.isValid()) {
      // do nothing
      return Promise.resolve(this.accessTokenResponse.accessToken);
    }
    let request = new TokenRequest(
      clientId, redirectUri, GRANT_TYPE_REFRESH_TOKEN, undefined,
      this.refreshToken, { 'client_secret': clientSecret });
    return this.tokenHandler.performTokenRequest(this.configuration, request)
      .then(response => {
        this.accessTokenResponse = response;
        return response.accessToken;
      });
  }
}
