# Installation

## OpenVPN Config File

- edit the `.conf` file in `/etc/openvpn` for Linux or the `.ovpn` file in `C:\Program Files\OpenVPN\config` in Windows
  - Reference the manual for your version of OpenVPN: <https://openvpn.net/community-resources/reference-manual-for-openvpn-2-6/>
- Add this line to your config file: `management 127.0.0.1 7505`
  - `127.0.0.1`: only allows connections to the management interface from programs running on this computer locally (for security)
    - you can change this to `0.0.0.0` to allow connections from outside of the computer, if you do, please specify a password file for security and add it to the end of the management line: `management 0.0.0.0 7505 pw-file`
      - `pw-file` is a file that only contains your password with no spaces or new lines
  - `7505`: any port not being used on this computer, use different ports for multiple OpenVPN servers running on the same computer
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
  - create multiple users by copying and pasting the format of the current login, adding commas between new entries (last element does not have a comma after it though)
    - make sure `username` is unique between entries
  - it is recommended to change the default username/password from admin/admin for added security
- `jsonWebToken`
  - `secret`: for added security, generate your own secret, different from the default one:
    - change directories to `utility` using the Node.js Command Prompt
    - `node genkey.js`
    - use this new value for this parameter
  - `expireMinutes`: use any of the string formats used by `ms`: <https://github.com/vercel/ms/blob/master/src/index.ts#L9>

### `server/src/openVPNservers.yaml`

- Example config file format, seperate multiple servers with a dash in front of `id` with all of the same properties as the first one (order of properties is not important)

```yaml
- id: 1
  name: Example Server 1
  host: 127.0.0.1
  port: 7505
  passwordPrompt:
  timeout: 5000
- id: 2...
```

- `id`: number >> **unique** ID for every server to allow for filtering and other operations
- `name`: string >> human readable name of OpenVPN server
- `host`: string >> IP address of the computer running the OpenVPN server, use `127.0.0.1` if this application is installed on the same computer as the OpenVPN server
- `port`: number (1-65535) >> port of the management interface set in the OpenVPN server's configuration file
- `passwordPrompt`: string >> leave this blank if a password file is not being used in the OpenVPN server's configuration file; if a password file is being used, this parameter will have the same value as its contents
- `timeout`: number >> amount of time in milliseconds before the management socket times out after inactivity

## Updating to New Version

- TODO

## Troubleshooting

- TODO
