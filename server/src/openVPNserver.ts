// interfaces
import { OpenVPNserversIntf } from "./interfaces/OpenVPNserversIntf";
import { ServerIdIntf } from "./interfaces/ServerIdIntf";
import { Event } from './enum/Event';
import { WSbyteCountIntf } from "./interfaces/websocket/WSbyteCountIntf";

// config
import config from "./serverConfig.json";

// libraries
import winston from "winston";
import { Socket, createConnection } from "net";
import { EventEmitter } from "events";

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
                        if (this.debug) {
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
                    try {
                        // log
                        this.logger.info(`${this.logID}setHandlers >> connected`);

                        // send password
                        await this.writeSocket(`${this.openVPNserver.password}\r\n`);    // return and newline required to submit the password

                        // request real-time notification of OpenVPN bandwidth usage every 5 seconds
                        //await this.writeSocket("bytecount 5\r\n");
                        await this.writeSocket("status 3\r\n");
                    } catch (error) {
                        this.logger.error(`${this.logID}setHandlers >> connect >> error = ${error}`);

                        // reconnect
                        clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                        this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
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

                this.socket.on("data", (data: Buffer) => {
                    // log
                    if (this.advDebug) {
                        this.logger.debug(`${this.logID}setHandlers >> data = ${data.toString()}`);
                    }

                    // get items, split by new line, filter out empty elements
                    const items: Array<string> = data.toString().split("\r\n").filter(item => item.length);
                    if (this.debug) {
                        this.logger.debug(`${this.logID}setHandlers >> items = ${JSON.stringify(items)}`);
                    }

                    // handle items
                    for (const item of items) {
                        if (item.startsWith(">")) { // command response
                            // get command and its response
                            const command: string = item.substring(item.indexOf(">"), item.indexOf(":"));
                            const commandResponse: string = item.substring(item.indexOf(":"));

                            // handle command
                            switch (command) {
                                case "BYTECOUNT_CLI": { // from bytecount command
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
                                    }

                                    break;
                                }
                                case "CLIENT_LIST": {   // from status command
                                    // CLIENT_LIST\tGIL7869\t50.218.86.210:52039\t10.10.0.172\t\t7327272\t78384567\t2023-01-02 10:35:29\t1672677329\tUNDEF\t31\t23\tAES-256-GCM
                                }
                                case "INFO": {
                                    break;
                                }
                                default: {
                                    this.logger.error(`${this.logID}setHandlers >> command unhandled >> command = ${command}`);
                                    break;
                                }
                            }
                        }
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
