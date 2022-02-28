# Angular OpenVPN Status Installation

## Client Installation

- `npm i luxon @types/luxon ngx-logger`
- Inactivity Logout <https://github.com/vespertilian/inactivity-countdown-timer>
  - `npm i inactivity-countdown-timer`
- Font Awesome Free <https://github.com/FortAwesome/angular-fontawesome>
  - `ng add @fortawesome/angular-fontawesome`
    - select all free
- MDBootstrap 5 - free license <https://mdbootstrap.com/docs/b5/angular/getting-started/installation/#section-npm>
  - `npm i mdb-angular-ui-kit`
- Progress
  - `ng add @progress/kendo-angular-dialog`
  - `ng add @progress/kendo-angular-inputs`
  - `ng add @progress/kendo-angular-buttons`
  - `ng add @progress/kendo-angular-label`
  - `ng add @progress/kendo-angular-notification`
  - `ng add @progress/kendo-angular-popup`
  - `ng add @progress/kendo-angular-indicators`
  - `ng add @progress/kendo-angular-ripple`

## Server Installation

- `npm init`
- `npm i typescript express @types/express compression @types/compression ts-node gulp gulp-cli gulp-typescript del axios @types/axios winston-loggly-bulk @types/winston-loggly-bulk winston jsonwebtoken @types/jsonwebtoken`

## Create App (client directory)

- `ng new ng-openvpn-status --style=scss --routing=true`

### Angular Generate Commands

- `ng g c login`
- `ng g c page-not-found`
- `ng g c home`
- `ng g service server`
- `ng g guard auth` // can activate
- `ng g guard logged-in`  // can activate
- `ng g interceptor http-error`

## Bench Testing

- compile code
  - `cd client`
    - `npm run watch`
  - `cd server`
    - `gulp`
    - in `src/serverConfig.json` set `localhostTesting` to `true`
- move files from `client\dist\ng-openvpn-status` and `server\dist` to `C:\inetpub\wwwroot\ng-openvpn-status_node` // both go to the same directory (they use the same package.json)
- cd `C:\inetpub\wwwroot\ng-openvpn-status_node`
- `npm i`
- `npm start` // command prompt will need to be run as administrator

## Hosting Website with Amazon Web Services

- *Note*: all of the packages used by server, need to be installed for client, because they share the same `node_modules` folder
- in `client/src/app/server.service.ts` change `SERVER`  to
- in `server/src/serverConfig.json` set `localhostTesting` to `false`
- build server: `cd server`, `gulp`
- build Angular application: `cd client`, `npm run build`
  - development: `npm run build-dev` or `npm run watch`
- copy the following into `client/dist/ng-openvpn-status`
  - `client/package.json`
  - all files in `server/dist/`

## Troubleshooting

- `ERROR in The Angular Compiler requires TypeScript >=3.6.4 and <3.9.0 but 3.9.5 was found instead.`
  - `npm i typescript@">=4.2.3 < 4.4"`
- `ERESOLVE unable to resolve dependency tree`
  - `npm config set legacy-peer-deps true`
