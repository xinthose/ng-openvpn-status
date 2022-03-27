# ng-openvpn-status

- **WORK IN PROGRESS - NO RELEASE YET**
- Angular OpenVPN status monitor.  Backend uses express and Node.js.
- Inspiration for project: `openvpn-status` written in Vue.js <https://github.com/AuspeXeu/openvpn-status.git>

## Configuration Notes

- `jsonWebToken`
  - `secret`: for added security, generate your own secret, different from the default one
    - change directories to `utility` using the Node.js Command Prompt
    - `node genkey.js`
    - use this new value for this parameter
  - `expireMinutes`: use any of the string formats used by `ms`: <https://github.com/vercel/ms>
