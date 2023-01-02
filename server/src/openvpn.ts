// interfaces
import { OpenVPNserversIntf } from "./interfaces/OpenVPNserversIntf";
import { ServerIdIntf } from "./interfaces/ServerIdIntf";

// config
import config from "./serverConfig.json";

// libraries
import express, { Router, Request, Response } from "express";
import winston from "winston";
import { parse, stringify } from "yaml";
import fs from "fs";
import { connect, Socket, TcpSocketConnectOpts, createConnection } from "net";

export class Openvpn {
    private logID: string = "Openvpn.";
    private debug: boolean = config.debug;
    private localhostTesting: boolean = config.localhostTesting;
    private logger: winston.Logger;
    public router: Router = express.Router();
    private fsPromises: any = fs.promises;
    private socket: Socket | undefined = undefined;

    constructor(logger: winston.Logger) {
        // set data
        this.logger = logger;

        this.router.get("/getConfig", [this.getConfig.bind(this)]);
        this.router.post("/updateConfig", [this.updateConfig.bind(this)]);
        this.router.post("/updateConfig", [this.updateConfig.bind(this)]);
        this.router.post("/connect", [this.connect.bind(this)]);
        this.router.post("/getStatus", [this.getStatus.bind(this)]);
    }

    private async getConfig(req: Request, res: Response) {
        try {
            // get yaml file
            let file: any;
            if (this.localhostTesting) {
                file = await this.fsPromises.readFile("C:/Users/adamd/Documents/GitHub/ng-openvpn-status/server/src/openVPNservers.yaml", "utf8");
            } else {
                file = await this.fsPromises.readFile("./openVPNservers.yaml", "utf8");
            }

            // parse the file
            const config: Array<OpenVPNserversIntf> = await parse(file);
            if (this.debug) {
                this.logger.debug(`${this.logID}getConfig >> config = ${JSON.stringify(config)}`);
            }

            // return response data
            res.status(200).send(config);
        } catch (error: any) {
            this.logger.error(`${this.logID}getConfig >> error = ${error}`);
            res.status(500).send(error);
        }
    }

    private async updateConfig(req: Request, res: Response) {
        try {
            // get data
            const openVPNservers: Array<OpenVPNserversIntf> = req.body;
            if (this.debug) {
                this.logger.debug(`${this.logID}updateConfig >> openVPNservers = ${JSON.stringify(openVPNservers)}`);
            }

            // convert it to a YAML string
            const yamlStr: string = stringify(openVPNservers);
            if (this.debug) {
                this.logger.debug(`${this.logID}updateConfig >> yamlStr = ${yamlStr}`);
            }

            // update config file
            if (this.localhostTesting) {
                await this.fsPromises.writeFile("C:/Users/adamd/Documents/GitHub/ng-openvpn-status/server/src/openVPNservers.yaml", yamlStr);
            } else {
                await this.fsPromises.writeFile("./openVPNservers.yaml", yamlStr);
            }

            // return response data
            res.status(200).json({ "message": "OK" });
        } catch (error: any) {
            this.logger.error(`${this.logID}updateConfig >> error = ${error}`);
            res.status(500).send(error);
        }
    }

    private async connect(req: Request, res: Response) {
        try {
            // get data
            const body: ServerIdIntf = req.body;
            if (this.debug) {
                this.logger.debug(`${this.logID}connect >> body = ${JSON.stringify(body)}`);
            }
            const id: number = body.id;

            // get yaml file
            let file: any;
            if (this.localhostTesting) {
                file = await this.fsPromises.readFile("C:/Users/adamd/Documents/GitHub/ng-openvpn-status/server/src/openVPNservers.yaml", "utf8");
            } else {
                file = await this.fsPromises.readFile("./openVPNservers.yaml", "utf8");
            }

            // parse the file
            const config: Array<OpenVPNserversIntf> = await parse(file);
            if (this.debug) {
                this.logger.debug(`${this.logID}connect >> config = ${JSON.stringify(config)}`);
            }

            // get server by ID
            const openvpnServer = config.find(openvpnServer => openvpnServer.id === id);
            if (this.debug) {
                this.logger.debug(`${this.logID}connect >> openvpnServer = ${JSON.stringify(openvpnServer)}`);
            }

            if (openvpnServer) {
                // connect
                await this.connectSocket(openvpnServer.host, openvpnServer.port, openvpnServer.timeout);

                // handle
                if (this.socket) {
                    this.setupSocketEvents();

                    // send password
                    await this.writeSocket(`${openvpnServer.password}\r\n`);    // return and newline required to submit the password

                    // request real-time notification of OpenVPN bandwidth usage every 5 seconds
                    await this.writeSocket("bytecount 5\r\n");

                    // return OK
                    res.status(200).json({ "message": "OK" });
                } else {
                    this.logger.error(`${this.logID}connect >> socket is not defined`);
                    res.status(404).json({ "message": `Socket is not defined.` })
                }
            } else {
                this.logger.error(`${this.logID}connect >> OpenVPN Server was not found by that ID: ${id}`);
                res.status(404).json({ "message": `OpenVPN Server was not found by that ID: ${id}` })
            }
        } catch (error: any) {
            this.logger.error(`${this.logID}connect >> error = ${error}`);
            res.status(500).send(error);
        }
    }

    private async getStatus(req: Request, res: Response) {
        try {
            // get data
            const body: ServerIdIntf = req.body;
            if (this.debug) {
                this.logger.debug(`${this.logID}connect >> body = ${JSON.stringify(body)}`);
            }
            const id: number = body.id;

            // send command
            await this.writeSocket("status 3\r\n"); // Show status information using the format of --status - version 3
            if (this.debug) {
                this.logger.debug(`${this.logID}connect >> status = ${JSON.stringify(status)}`);
            }

            // return OK
            res.status(200).json({ "message": "OK" });
        } catch (error: any) {
            this.logger.error(`${this.logID}connect >> error = ${error}`);
            res.status(500).send(error);
        }
    }

    // utility 

    private connectSocket(host: string, port: number, timeout: number): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.socket = createConnection({
                    "host": host,
                    "port": port,
                    "timeout": timeout,
                }, () => {
                    if (this.debug) {
                        this.logger.debug(`${this.logID}connectSocket >> connection created to ${host}:${port}`);
                    }
                    resolve();
                });
            } catch (error: any) {
                this.logger.error(`${this.logID}connectSocket >> error = ${error}`);
                reject(error.toString());
            }
        });
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

    private setupSocketEvents() {
        try {
            if (this.socket) {
                this.socket.on("data", (data: Buffer) => {
                    if (this.debug) {
                        this.logger.debug(`${this.logID}setupSocketEvents >> data received; data = ${JSON.stringify(data)}`);
                    }

                });

                this.socket.on("error", (err: Error) => {
                    this.logger.error(`${this.logID}setupSocketEvents >> error received; error = ${err}`);

                });

                this.socket.on("close", (hadError: boolean) => {
                    this.logger.error(`${this.logID}setupSocketEvents >> close received; hadError = ${hadError}`);
                });

                this.socket.on("timeout", () => {
                    this.logger.error(`${this.logID}setupSocketEvents >> timeout received`);
                });
            } else {
                throw new Error("socket is not defined");
            }
        } catch (error: any) {
            this.logger.error(`${this.logID}setupSocketEvents >> error = ${error}`);
            throw new Error(error.toString());
        }
    }
}
