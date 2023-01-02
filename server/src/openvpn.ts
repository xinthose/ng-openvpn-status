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
import { Telnet } from "telnet-client";

export class Openvpn {
    private logID: string = "Openvpn.";
    private debug: boolean = config.debug;
    private localhostTesting: boolean = config.localhostTesting;
    private logger: winston.Logger;
    public router: Router = express.Router();
    private fsPromises: any = fs.promises;
    private telnet: Telnet;

    constructor(logger: winston.Logger, telnet: Telnet) {
        // set data
        this.logger = logger;
        this.telnet = telnet;

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
                this.logger.error(`${this.logID}getConfig >> config = ${JSON.stringify(config)}`);
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
                this.logger.error(`${this.logID}getConfig >> config = ${JSON.stringify(config)}`);
            }

            // get server by ID
            const openvpnServer = config.find(openvpnServer => openvpnServer.id === id);

            if (openvpnServer) {
                // create connection to server
                await this.telnet.connect({
                    "host": openvpnServer.host,
                    "port": openvpnServer.port,
                    "passwordPrompt": openvpnServer.passwordPrompt,
                    "timeout": openvpnServer.timeout,
                });

                // return response data
                res.status(200).json({ "message": "OK" });
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

            const status = await this.telnet.exec("status");
            if (this.debug) {
                this.logger.debug(`${this.logID}connect >> status = ${JSON.stringify(status)}`);
            }

            res.status(200).send(status);
        } catch (error: any) {
            this.logger.error(`${this.logID}connect >> error = ${error}`);
            res.status(500).send(error);
        }
    }
}
