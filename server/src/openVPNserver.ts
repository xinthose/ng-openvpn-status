// interfaces
import { OpenVPNserversIntf } from "./interfaces/OpenVPNserversIntf";
import { ServerIdIntf } from "./interfaces/ServerIdIntf";
import { Event } from './enum/Event';
import { WSbyteCountIntf } from "./interfaces/websocket/WSbyteCountIntf";
import { WSstatusIntf } from "./interfaces/websocket/WSstatusIntf";
import { WSroutingTableIntf } from "./interfaces/websocket/WSroutingTableIntf";
import { WSserverTimeIntf } from "./interfaces/websocket/WSserverTimeIntf";

// config
import config from "./serverConfig.json";

// libraries
import winston from "winston";
import { Socket, createConnection } from "net";
import { EventEmitter } from "events";
import { DateTime } from "luxon";

export class OpenvpnServer {
    private logID: string = "OpenvpnServer";
    private debug: boolean = config.debug;
    private advDebug: boolean = config.advDebug;
    private logger: winston.Logger;
    private eventEmitter: EventEmitter;
    private openVPNserver: OpenVPNserversIntf;
    private socket: Socket | undefined;
    private reconnectTime: number = 10 * 1000;  // milliseconds
    // timeouts
    private reconnectTimeout!: NodeJS.Timeout;
    private getStatusInterval!: NodeJS.Timer;

    constructor(logger: winston.Logger, eventEmitter: EventEmitter, openVPNserver: OpenVPNserversIntf) {
        // set data
        this.logger = logger;
        this.eventEmitter = eventEmitter;
        this.openVPNserver = openVPNserver;
        this.logID = `OpenvpnServer >> ${this.openVPNserver.host}:${this.openVPNserver.port} >> `;

        // connect
        this.connect();
    }

    // public

    public writeSocket(data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (this.socket) {
                    this.socket.write(data, () => {
                        if (this.advDebug) {
                            this.logger.debug(`${this.logID}writeSocket >> data successfully written; data = ${data}`);
                        }
                        resolve();
                    });
                } else {
                    throw new Error("socket is not defined");
                }
            } catch (error: any) {
                this.logger.error(`${this.logID}writeSocket >> error = ${error}`);
                reject(error.toString());
            }
        });
    }

    public async shutdown() {
        try {
            if (this.socket) {
                this.socket.removeAllListeners();
            }

            await this.endSocket();
        } catch (error: any) {
            this.logger.error(`${this.logID}shutdown >> error = ${error}`);
        }
    }

    // private 

    private connect() {
        // connect to server
        this.socket = createConnection({
            "host": this.openVPNserver.host,
            "port": this.openVPNserver.port,
            "timeout": this.openVPNserver.timeout,
        });

        // set handlers on socket
        this.setHandlers();
    }

    private async reconnect() {
        try {
            if (this.socket) {
                this.socket.removeAllListeners();
            }

            // clear get status interval
            clearInterval(this.getStatusInterval);

            await this.endSocket();

            this.connect();
        } catch (error: any) {
            this.logger.error(`${this.logID}reconnect >> error = ${error}`);

            // reconnect
            clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
            this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
        }
    }

    private setHandlers() {
        try {
            if (this.socket) {
                this.socket.once("error", (error: Error) => {
                    // log
                    this.logger.error(`${this.logID}setHandlers >> connection error >> error = ${error}`);

                    // emit event
                    this.eventEmitter.emit(Event.SOCKET_ERROR, this.openVPNserver.id);

                    // reconnect
                    clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                    this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
                });

                this.socket.once("connect", async () => {
                    // log
                    this.logger.info(`${this.logID}setHandlers >> connected`);

                    if (this.socket) {
                        this.socket.setKeepAlive(true);
                    }
                });

                this.socket.once("close", (hadError: boolean) => {
                    // log
                    this.logger.error(`${this.logID}setHandlers >> connection closeed >> hadError = ${hadError}`);

                    // emit event
                    this.eventEmitter.emit(Event.SOCKET_CLOSE, this.openVPNserver.id);

                    // reconnect
                    clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                    this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
                });

                this.socket.once("end", () => {
                    // log
                    this.logger.error(`${this.logID}setHandlers >> connection ended`);

                    // emit event
                    this.eventEmitter.emit(Event.SOCKET_CLOSE, this.openVPNserver.id);

                    // reconnect
                    clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                    this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
                });

                this.socket.once("timeout", () => {
                    // log
                    this.logger.error(`${this.logID}setHandlers >> connection timeout`);

                    // emit event
                    this.eventEmitter.emit(Event.SOCKET_TIMEOUT, this.openVPNserver.id);

                    // reconnect
                    clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                    this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
                });

                this.socket.on("data", async (data: Buffer) => {
                    try {
                        // log
                        if (this.advDebug) {
                            this.logger.debug(`${this.logID}setHandlers >> data = ${data.toString()}`);
                        }

                        // get items, split by new line, filter out empty elements
                        const items: Array<string> = data.toString().split("\r\n").filter(item => item.length);
                        if (this.advDebug) {
                            this.logger.debug(`${this.logID}setHandlers >> items = ${JSON.stringify(items)}`);
                        }

                        if (items.length) {
                            // handle items
                            for (const item of items) {
                                if (item.startsWith(">")) {
                                    // get command and its response
                                    const command: string = item.substring(item.indexOf(">") + 1, item.indexOf(":"));
                                    const commandResponse: string = item.substring(item.indexOf(":"));

                                    // handle command
                                    switch (command) {
                                        case "BYTECOUNT_CLI": { // from bytecount command
                                            if (this.debug) {
                                                this.logger.debug(`${this.logID}setHandlers >> BYTECOUNT_CLI >> received`);
                                            }
                                            // >BYTECOUNT_CLI:85,7222360,77293927

                                            // split string 
                                            const byteCountArr: Array<string> = commandResponse.split(",");

                                            if (byteCountArr.length == 3) {
                                                // create data
                                                const data: WSbyteCountIntf = {
                                                    "serverID": this.openVPNserver.id,
                                                    "clientID": Number(byteCountArr[0]),
                                                    "bytesReceived": Number(byteCountArr[1]),	// from client
                                                    "bytesSent": Number(byteCountArr[2]),		// to client
                                                }

                                                // emit event
                                                this.eventEmitter.emit(Event.BYTECOUNT_CLI, data);
                                            } else {
                                                if (this.advDebug) {
                                                    this.logger.error(`${this.logID}setHandlers >> BYTECOUNT_CLI array length is wrong >> byteCountArr.length = ${byteCountArr.length}; item = ${JSON.stringify(item)}`);
                                                }
                                            }

                                            break;
                                        }
                                        case "INFO": {
                                            break;
                                        }
                                        default: {
                                            if (this.advDebug) {
                                                this.logger.error(`${this.logID}setHandlers >> command unhandled (>) >> command = ${command}; item = ${JSON.stringify(item)}`);
                                            }
                                            break;
                                        }
                                    }
                                } else if (item.indexOf("\t")) {
                                    // split item by its escapped tab character
                                    const sub_items: Array<string> = item.split("\t");
                                    const command: string = sub_items[0];

                                    // handle command
                                    switch (command) {
                                        case "ENTER PASSWORD:": {
                                            if (this.debug) {
                                                this.logger.debug(`${this.logID}setHandlers >> ENTER PASSWORD >> received`);
                                            }

                                            // send password
                                            await this.writeSocket(`${this.openVPNserver.password}\r\n`);    // return and newline required to submit the password
                                            break;
                                        }
                                        case "SUCCESS: password is correct": {
                                            if (this.debug) {
                                                this.logger.debug(`${this.logID}setHandlers >> SUCCESS: password is correct >> received`);
                                            }

                                            // request real-time notification of OpenVPN bandwidth usage every 5 seconds
                                            //await this.writeSocket("bytecount 5\r\n");

                                            this.getStatusInterval = setInterval(() => {
                                                if (this.advDebug) {
                                                    this.logger.debug(`${this.logID}setHandlers >> getStatusInterval >> running`);
                                                }

                                                this.writeSocket("status 3\r\n");
                                            }, config.getStatusInterval);
                                            break;
                                        }
                                        case "CLIENT_LIST": {   // from status command
                                            if (this.advDebug) {
                                                this.logger.debug(`${this.logID}setHandlers >> CLIENT_LIST >> received`);
                                            }
                                            // CLIENT_LIST\tGIL7869\t50.218.86.210:52039\t10.10.0.172\t\t7327272\t78384567\t2023-01-02 10:35:29\t1672677329\tUNDEF\t31\t23\tAES-256-GCM

                                            if (sub_items.length == 13) {
                                                // get data
                                                const connectedSince: Date = DateTime.fromFormat(sub_items[7], "yyyy-MM-dd hh:mm:ss").toJSDate();

                                                // create data
                                                const data: WSstatusIntf = {
                                                    "serverID": this.openVPNserver.id,
                                                    "CommonName": sub_items[1],
                                                    "RealAddress": sub_items[2],
                                                    "VirtualAddress": sub_items[3],
                                                    "VirtualIPv6Address": sub_items[4],
                                                    "BytesReceived": Number(sub_items[5]),
                                                    "BytesSent": Number(sub_items[6]),
                                                    "ConnectedSince": connectedSince,
                                                    "ConnectedSinceEpoch": Number(sub_items[8]),
                                                    "Username": sub_items[9],
                                                    "ClientID": Number(sub_items[10]),
                                                    "PeerID": Number(sub_items[11]),
                                                    "DataChannelCipher": sub_items[12],
                                                };

                                                // emit event
                                                this.eventEmitter.emit(Event.CLIENT_LIST, data);
                                            } else {
                                                if (this.advDebug) {
                                                    this.logger.error(`${this.logID}setHandlers >> CLIENT_LIST array length is wrong >> sub_items.length = ${sub_items.length}; item = ${JSON.stringify(item)}`);
                                                }
                                            }

                                            break;
                                        }
                                        case "ROUTING_TABLE": {   // from status command
                                            if (this.advDebug) {
                                                this.logger.debug(`${this.logID}setHandlers >> ROUTING_TABLE >> received`);
                                            }

                                            // ROUTING_TABLE\t10.10.0.127\tGIL8165\t74.50.129.230:59399\t2023-02-05 03:26:20\t1675589180
                                            // \"ROUTING_TABLE\\t10.10.0.83\\tPAL8009\\t209.188.118.137:55484\\t2023-02-14 0\""

                                            if (sub_items.length == 6) {
                                                // get data
                                                const lastRef: Date = DateTime.fromFormat(sub_items[4], "yyyy-MM-dd hh:mm:ss").toJSDate();

                                                // create data
                                                const data: WSroutingTableIntf = {
                                                    "serverID": this.openVPNserver.id,
                                                    "VirtualAddress": sub_items[1],
                                                    "CommonName": sub_items[2],
                                                    "RealAddress": sub_items[3],
                                                    "LastRef": lastRef,
                                                    "LastRefEpoch": Number(sub_items[5]),
                                                };

                                                // emit event
                                                this.eventEmitter.emit(Event.ROUTING_TABLE, data);
                                            } else {
                                                if (this.advDebug) {
                                                    this.logger.error(`${this.logID}setHandlers >> ROUTING_TABLE array length is wrong >> sub_items.length = ${sub_items.length}; item = ${JSON.stringify(item)}`);
                                                }
                                            }

                                            break;
                                        }
                                        case "TIME": {
                                            if (this.advDebug) {
                                                this.logger.debug(`${this.logID}setHandlers >> TIME >> received`);
                                            }

                                            // TIME\t2023-02-05 22:36:17\t1675658177

                                            if (sub_items.length == 3) {
                                                // get data
                                                const serverTime: Date = DateTime.fromFormat(sub_items[1], "yyyy-MM-dd hh:mm:ss").toJSDate();

                                                // create data
                                                const data: WSserverTimeIntf = {
                                                    "serverID": this.openVPNserver.id,
                                                    "ServerTime": serverTime,
                                                    "ServerTimeEpoch": Number(sub_items[2]),
                                                };

                                                // emit event
                                                this.eventEmitter.emit(Event.SERVER_TIME, data);
                                            } else {
                                                if (this.advDebug) {
                                                    this.logger.error(`${this.logID}setHandlers >> TIME array length is wrong >> sub_items.length = ${sub_items.length}; item = ${JSON.stringify(item)}`);
                                                }
                                            }

                                            break;
                                        }
                                        case "TITLE": {
                                            break;
                                        }
                                        case "HEADER": {
                                            break;
                                        }
                                        case "GLOBAL_STATS": {
                                            break;
                                        }
                                        case "END": {
                                            break;
                                        }
                                        default: {
                                            if (this.advDebug) {
                                                this.logger.error(`${this.logID}setHandlers >> command unhandled (\t) >> command = ${command}; item = ${JSON.stringify(item)}`);
                                            }
                                            break;
                                        }
                                    }

                                } else {
                                    if (this.advDebug) {
                                        this.logger.error(`${this.logID}setHandlers >> item unhandled >> item = ${JSON.stringify(item)}`);
                                    }
                                }
                            }
                        } else {
                            if (this.advDebug) {
                                this.logger.error(`${this.logID}setHandlers >> items unhandled >> items = ${JSON.stringify(items)}`);
                            }
                        }
                    } catch (error) {
                        this.logger.error(`${this.logID}setHandlers >> data >> error = ${error}`);

                        // reconnect
                        clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                        this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
                    }
                });
            } else {
                throw new Error("socket is not defined");
            }
        } catch (error: any) {
            this.logger.error(`${this.logID}setHandlers >> error = ${error}`);
        }
    }

    private endSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.socket) {
                this.socket.end(() => {
                    this.logger.info(`${this.logID}endSocket >> socket closed`);
                    resolve();
                });
            }
        });
    }
}
