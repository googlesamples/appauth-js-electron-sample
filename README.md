# AppAuth-JS + Electron

![AppAuth-JS + Electron](https://rawgit.com/googlesamples/appauth-js-electron-sample/master/logo.svg)

This is an Electron Application, which uses the [AppAuth-JS](https://github.com/openid/AppAuth-JS) library.

Please note that this is not an official Google product.

## Development

This application has been written with [TypeScript](https://typescriptlang.org).

### Setup

* Install the latest version of [Node](https://nodejs.org/en/).
  [NVM](https://github.com/creationix/nvm)
  (Node Version Manager is highly recommended).

* Use `nvm install` to install the recommended Node.js version.

* Download the latest version of Visual Studio Code from
  [here](https://code.visualstudio.com/).

* Install [Yarn](https://yarnpkg.com/en/docs/install) package manager.

### Provision Dependencies

* `yarn install` or `npm install` to provision all the package depencies (from the folder that contains `package.json`).

Thats it! You are now ready to start.

### Development Workflow

This project has a few scripts to help you with your development workflow.

* `yarn run dev` or `npm run-script dev` will run the Electron application. This will also start the Typescript compiler in `watch` mode, and will automatically recompile your application as you start to make changes. Just reload the electron application to see your changes.

* `yarn start` or `npm start` is to start the Electron application (without setting up watches that monitor for changes).
