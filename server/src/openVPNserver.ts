// interfaces
import { OpenVPNserversIntf } from "./interfaces/OpenVPNserversIntf";
import { ServerIdIntf } from "./interfaces/ServerIdIntf";
import { Event } from './enum/Event';

// config
import config from "./serverConfig.json";

// libraries
import winston from "winston";
import { Socket, createConnection } from "net";
import { EventEmitter } from "events";

export class OpenvpnServer {
    private logID: string = "OpenvpnServer";
    private debug: boolean = config.debug;
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

    // utility 

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
                    this.logger.error(`${this.logID}constructor >> connection error >> error = ${error}`);

                    // emit event
                    this.eventEmitter.emit(`${Event.SOCKET_ERROR}_${this.openVPNserver.id}`);

                    // reconnect
                    clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                    this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
                });

                this.socket.once("connect", async () => {
                    try {
                        // log
                        this.logger.info(`${this.logID}constructor >> connected`);

                        // send password
                        await this.writeSocket(`${this.openVPNserver.password}\r\n`);    // return and newline required to submit the password

                        // request real-time notification of OpenVPN bandwidth usage every 5 seconds
                        await this.writeSocket("bytecount 5\r\n");
                    } catch (error) {
                        this.logger.error(`${this.logID}setHandlers >> connect >> error = ${error}`);

                        // reconnect
                        clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                        this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
                    }
                });

                this.socket.once("close", (hadError: boolean) => {
                    // log
                    this.logger.error(`${this.logID}constructor >> connection closeed >> hadError = ${hadError}`);

                    // emit event
                    this.eventEmitter.emit(`${Event.SOCKET_CLOSE}_${this.openVPNserver.id}`);

                    // reconnect
                    clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                    this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
                });

                this.socket.once("end", () => {
                    // log
                    this.logger.error(`${this.logID}constructor >> connection ended`);

                    // emit event
                    this.eventEmitter.emit(`${Event.SOCKET_CLOSE}_${this.openVPNserver.id}`);

                    // reconnect
                    clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                    this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
                });

                this.socket.once("timeout", () => {
                    // log
                    this.logger.error(`${this.logID}constructor >> connection timeout`);

                    // emit event
                    this.eventEmitter.emit(`${Event.SOCKET_TIMEOUT}_${this.openVPNserver.id}`);

                    // reconnect
                    clearTimeout(this.reconnectTimeout);    // clear current call to reconnect (to avoid stacking up)
                    this.reconnectTimeout = setTimeout(() => this.reconnect(), this.reconnectTime);
                });

                this.socket.on("data", (data: Buffer) => {
                    // log
                    if (this.debug) {
                        this.logger.debug(`${this.logID}constructor >> data = ${JSON.stringify(data)}`);
                    }

                    // get items, split by new line, filter out empty elements
                    const items: Array<string> = data.toString().split("\r\n").filter(item => item.length);
                    if (this.debug) {
                        this.logger.debug(`${this.logID}setupSocketEvents >> items = ${JSON.stringify(items)}`);
                    }
                });
            } else {
                throw new Error("socket is not defined");
            }
        } catch (error: any) {
            this.logger.error(`${this.logID}setHandlers >> error = ${error}`);
        }
    }

    private writeSocket(data: string): Promise<void> {
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
