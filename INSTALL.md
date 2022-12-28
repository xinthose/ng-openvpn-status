# Installation

## OpenVPN Config File

- edit the `.conf` file in `/etc/openvpn` for Linux or the `.ovpn` file in `C:\Program Files\OpenVPN\config` in Windows
  - Reference the manual for your version of OpenVPN: <https://openvpn.net/community-resources/reference-manual-for-openvpn-2-6/>
- Add this line to your config file: `management 127.0.0.1 7505`
  - `127.0.0.1`: only allows connections to the management interface from programs running on this computer locally (for security)
  - `7505`: any port not being used on this computer
- save the config file and restart your OpenVPN service (will close all current connections)
  - Linux: `service openvpn restart`
  - Windows: open the `Services` app, find `OpenVPNService`, right click it and tell it to restart

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

### `server/src/openVPNservers.yaml`

- Example config file format, seperate multiple servers with a dash in front of `name`

```config
- name: Example Server 1
  host: 10.1.1.196
  localAddress: 0.0.0.0
  port: 32977
  timeout: 5000
- name: Example Server 2...
```

- `name`: string: uman readable name of OpenVPN server
- `host`: IP address of the computer running the OpenVPN server

## Updating to New Version

- TODO

## Troubleshooting

- TODO
