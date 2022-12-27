# Angular OpenVPN Status Installation

## Create App (client directory)

- `ng new ng-openvpn-status --style=scss --routing=true`

### Angular Generate Commands

- `ng g c login`
- `ng g c page-not-found`
- `ng g c home`
- `ng g c config`
- `ng g service server`
- `ng g guard auth` // can activate
- `ng g guard logged-in`  // can activate
- `ng g interceptor http-error`

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
- `npm i typescript express @types/express compression @types/compression ts-node gulp @types/gulp gulp-cli gulp-typescript del axios @types/axios winston-loggly-bulk @types/winston-loggly-bulk winston jsonwebtoken @types/jsonwebtoken cors @types/cors redis telnet-client`

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

## Troubleshooting

- `ERROR in The Angular Compiler requires TypeScript >=4.8.2 and <4.9.0 but 3.9.5 was found instead.`
  - `npm i typescript@">=4.8.2 < 4.9.0"`
