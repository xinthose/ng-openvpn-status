import { OpenvpnServer } from './serverMain';

let app = new OpenvpnServer().getApp();
export { app };