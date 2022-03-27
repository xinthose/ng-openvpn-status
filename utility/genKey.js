// RUN: node genKey.js
// output goes in server/src/serverConfig.json --> jsonWebToken.secret
console.log(require('crypto').randomBytes(64).toString('hex'));