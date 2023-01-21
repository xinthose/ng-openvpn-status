// interfaces
import { OpenVPNserversIntf } from "./interfaces/OpenVPNserversIntf";
import { ServerIdIntf } from "./interfaces/ServerIdIntf";
import { Event } from './enum/Event';

// config
import config from "./serverConfig.json";

// libraries
import express, { Router, Request, Response } from "express";
import winston from "winston";
import { parse, stringify } from "yaml";
import fs from "fs";
import { Socket, createConnection } from "net";
import { EventEmitter } from "events";

export class OpenvpnServer {
    private logID: string = "OpenvpnServer";
    private debug: boolean = config.debug;
    private localhostTesting: boolean = config.localhostTesting;
    private logger: winston.Logger;
    public eventEmitter: EventEmitter;
    public router: Router = express.Router();
    private fsPromises: any = fs.promises;
    private openVPNserver: OpenVPNserversIntf;
    private socket: Socket | undefined;
    // timeouts
    private callConnectTimeout!: NodeJS.Timeout;

    constructor(logger: winston.Logger, eventEmitter: EventEmitter, openVPNserver: OpenVPNserversIntf) {
        // set data
        this.logger = logger;
        this.eventEmitter = eventEmitter;
        this.openVPNserver = openVPNserver;
        this.logID = `OpenvpnServer >> ${this.openVPNserver.host}:${this.openVPNserver.port} >> `;

        try {
            // connect to server
            this.socket = createConnection({
                "host": this.openVPNserver.host,
                "port": this.openVPNserver.port,
                "timeout": this.openVPNserver.timeout,
            }, () => {
                this.logger.info(`${this.logID}constructor >> connection created`);
            });

            // set handlers
            this.socket.on("error", (error: Error) => {
                this.logger.error(`${this.logID}constructor >> error = ${error}`);

            });
        } catch (error: any) {
            this.logger.error(`${this.logID}constructor >> error = ${error}`);
        }
    }

    // utility 

    private async connect() {
        try {
            // get yaml file
            let file: any;
            if (this.localhostTesting) {
                file = await this.fsPromises.readFile("C:/Users/adamd/Documents/GitHub/ng-openvpn-status/server/src/openVPNservers.yaml", "utf8");
            } else {
                file = await this.fsPromises.readFile("./openVPNservers.yaml", "utf8");
            }

            // parse the file
            const openvpnServers: Array<OpenVPNserversIntf> = await parse(file);
            if (this.debug) {
                this.logger.debug(`${this.logID}connect >> openvpnServers = ${JSON.stringify(openvpnServers)}`);
            }

            // handle
            if (openvpnServers) {
                // clear sockets array
                this.sockets = [];

                // connect to servers
                for (const openvpnServer of openvpnServers) {
                    // connect; order of creation is based on index, which matches ID
                    await this.connectSocket(openvpnServer.host, openvpnServer.port, openvpnServer.timeout);

                    // handle
                    this.setupSocketEvents(openvpnServer.id);

                    // send password
                    await this.writeSocket(openvpnServer.id, `${openvpnServer.password}\r\n`);    // return and newline required to submit the password

                    // request real-time notification of OpenVPN bandwidth usage every 5 seconds
                    await this.writeSocket(openvpnServer.id, "bytecount 5\r\n");
                }
            }
        } catch (error: any) {
            this.logger.error(`${this.logID}connect >> error = ${error}`);
        }
    }

    private async disconnect() {
        try {
            if (this.sockets) {
                for (let index = 0; index < this.sockets.length; index++) {
                    await this.endSocket(index);
                    this.sockets[index].destroy();
                    if (this.debug) {
                        this.logger.debug(`${this.logID}disconnect >> connection closed to socket #${index}`);
                    }
                }
            }
        } catch (error: any) {
            this.logger.error(`${this.logID}connect >> error = ${error}`);
            throw new Error(error.toString());
        }
    }

    private writeSocket(id: number, data: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (this.sockets) {
                    if (this.sockets[id]) {
                        this.sockets[id].write(data, () => {
                            if (this.debug) {
                                this.logger.debug(`${this.logID}writeSocket >> data successfully written; id = ${id}; data = ${data}`);
                            }
                            resolve();
                        });
                    } else {
                        throw new Error(`socket is not defined; id = ${id}`);
                    }
                } else {
                    throw new Error("sockets is not defined");
                }
            } catch (error: any) {
                this.logger.error(`${this.logID}writeSocket >> error = ${error}`);
                reject(error.toString());
            }
        });
    }

    private setupSocketEvents(id: number) {
        try {
            if (this.sockets) {
                if (this.sockets[id]) {
                    this.sockets[id].on("data", (data: Buffer) => {
                        if (this.debug) {
                            this.logger.debug(`${this.logID}setupSocketEvents >> data received; id = ${id}; data = ${JSON.stringify(data)}`);
                        }

                        // get items, split by new line, filter out empty elements
                        const items: Array<string> = data.toString().split("\r\n").filter(item => item.length);
                        if (this.debug) {
                            this.logger.debug(`${this.logID}setupSocketEvents >> id = ${id}; items = ${JSON.stringify(items)}`);
                        }
                    });

                    this.sockets[id].on("error", (err: Error) => {
                        // log
                        this.logger.error(`${this.logID}setupSocketEvents >> error received; id = ${id}; error = ${err}`);

                        // emit event
                        this.eventEmitter.emit(Event.SOCKET_ERROR);
                    });

                    this.sockets[id].on("close", (hadError: boolean) => {
                        // log
                        this.logger.error(`${this.logID}setupSocketEvents >> close received; id = ${id}; hadError = ${hadError}`);

                        // emit event
                        this.eventEmitter.emit(Event.SOCKET_CLOSE);
                    });

                    this.sockets[id].on("timeout", () => {
                        // log
                        this.logger.error(`${this.logID}setupSocketEvents >> timeout received; id = ${id}`);

                        // emit event
                        this.eventEmitter.emit(Event.SOCKET_TIMEOUT);
                    });
                } else {
                    throw new Error(`socket is not defined; id = ${id}`);
                }
            } else {
                throw new Error("sockets is not defined");
            }
        } catch (error: any) {
            this.logger.error(`${this.logID}setupSocketEvents >> error = ${error}`);
            throw new Error(error.toString());
        }
    }

    private endSocket(id: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                if (this.sockets) {
                    if (this.sockets[id]) {
                        this.sockets[id].end(() => {
                            if (this.debug) {
                                this.logger.debug(`${this.logID}endSocket >> socket closed; id = ${id}`);
                            }
                            resolve();
                        });
                    } else {
                        throw new Error(`socket is not defined; id = ${id}`);
                    }
                } else {
                    throw new Error("sockets is not defined");
                }
            } catch (error: any) {
                this.logger.error(`${this.logID}endSocket >> error = ${error}`);
                reject(error.toString());
            }
        });
    }
}
