# ng-openvpn-status

## **WORK IN PROGRESS - NO RELEASE YET**

## About

- OpenVPN status monitor.  Front end is built in Angular, backend uses express and Node.js.
- Inspiration for this project: [`openvpn-status`](https://github.com/AuspeXeu/openvpn-status.git) written in Vue.js.
- Read [`INSTALL.md`](https://github.com/xinthose/ng-openvpn-status/blob/main/INSTALL.md) for installation instructions.

## Configuration Notes

### `client/src/assets/config.json`

- `autoLogin`: automatically login on the login page, using the default username/password of admin/admin
- `inactivityLogoutTime`: time in milliseconds you want an inactive user to be logged out after
- `appTitle`: title of the app as seen in the browser tab and navbar

### `server/src/serverConfig.json`

- users
  - create multiple users by copying and pasting the format of the current login, adding commas between new entries
    - make sure `username` is unique between entries
  - it is recommended to change the default username/password from admin/admin for added security
- `jsonWebToken`
  - `secret`: for added security, generate your own secret, different from the default one:
    - change directories to `utility` using the Node.js Command Prompt
    - `node genkey.js`
    - use this new value for this parameter
  - `expireMinutes`: use any of the string formats used by `ms`: <https://github.com/vercel/ms/blob/master/src/index.ts#L9>
