import {AuthorizationRequest} from '@openid/appauth/src/authorization_request';
import {AuthorizationNotifier, AuthorizationRequestHandler, AuthorizationRequestResponse, BUILT_IN_PARAMETERS} from '@openid/appauth/src/authorization_request_handler';
import {AuthorizationResponse} from '@openid/appauth/src/authorization_response';
import {AuthorizationServiceConfiguration} from '@openid/appauth/src/authorization_service_configuration';
import {NodeBasedHandler} from '@openid/appauth/src/node_support/node_request_handler';
import {NodeRequestor} from '@openid/appauth/src/node_support/node_requestor';
import {GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_REFRESH_TOKEN, TokenRequest} from '@openid/appauth/src/token_request';
import {BaseTokenRequestHandler, TokenRequestHandler} from '@openid/appauth/src/token_request_handler';
import {TokenError, TokenResponse} from '@openid/appauth/src/token_response';

import {log} from './logger';

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

  // state
  configuration: AuthorizationServiceConfiguration|undefined;

  constructor() {
    this.notifier = new AuthorizationNotifier();
    this.authorizationHandler = new NodeBasedHandler();
    this.tokenHandler = new BaseTokenRequestHandler(requestor);
    // set notifier to deliver responses
    this.authorizationHandler.setAuthorizationNotifier(this.notifier);
    // set a listener to listen for authorization responses
    // make refresh and access token requests.
    this.notifier.setAuthorizationListener((request, response, error) => {
      log('Authorization request complete ', request, response, error);
      if (response) {
        this.makeRefreshTokenRequest(this.configuration!, response.code)
            .then(
                result => this.makeAccessTokenRequest(
                    this.configuration!, result.refreshToken!))
            .then(() => log('All done.'));
      }
    });
  }

  fetchServiceConfiguration(): Promise<AuthorizationServiceConfiguration> {
    return AuthorizationServiceConfiguration
        .fetchFromIssuer(openIdConnectUrl, requestor)
        .then(response => {
          log('Fetched service configuration', response);
          return response;
        });
  }

  makeAuthorizationRequest(configuration: AuthorizationServiceConfiguration) {
    // create a request
    let request = new AuthorizationRequest(
        clientId, redirectUri, scope, AuthorizationRequest.RESPONSE_TYPE_CODE,
        undefined, /* state */
        {'prompt': 'consent', 'access_type': 'offline'});

    log('Making authorization request ', configuration, request);
    this.authorizationHandler.performAuthorizationRequest(
        configuration, request);
  }

  makeRefreshTokenRequest(
      configuration: AuthorizationServiceConfiguration, code: string) {
    // use the code to make the token request.
    let request = new TokenRequest(
        clientId, redirectUri, GRANT_TYPE_AUTHORIZATION_CODE, code, undefined,
        {'client_secret': clientSecret});

    return this.tokenHandler.performTokenRequest(configuration, request)
        .then(response => {
          log(`Refresh Token is ${response.refreshToken}`);
          return response;
        });
  }

  makeAccessTokenRequest(
      configuration: AuthorizationServiceConfiguration, refreshToken: string) {
    let request = new TokenRequest(
        clientId, redirectUri, GRANT_TYPE_REFRESH_TOKEN, undefined,
        refreshToken, {'client_secret': clientSecret});

    return this.tokenHandler.performTokenRequest(configuration, request)
        .then(response => {
          log(`Access Token is ${response.accessToken}`);
          return response;
        });
  }
}
