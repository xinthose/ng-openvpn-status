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
import { EventEmitter } from "events";

export class Openvpn {
    private logID: string = "Openvpn.";
    private debug: boolean = config.debug;
    private localhostTesting: boolean = config.localhostTesting;
    private logger: winston.Logger;
    public eventEmitter: EventEmitter;
    public router: Router = express.Router();
    private fsPromises: any = fs.promises;

    constructor(logger: winston.Logger, eventEmitter: EventEmitter) {
        // set data
        this.logger = logger;
        this.eventEmitter = eventEmitter;

        // set routes
        this.router.get("/getConfig", [this.getConfig.bind(this)]);
        this.router.post("/updateConfig", [this.updateConfig.bind(this)]);
        this.router.post("/getStatus", [this.getStatus.bind(this)]);

        // connect to servers
        this.connect();
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
            const openvpnServers: Array<OpenVPNserversIntf> = await parse(file);
            if (this.debug) {
                this.logger.debug(`${this.logID}getConfig >> openvpnServers = ${JSON.stringify(openvpnServers)}`);
            }

            // return response data
            res.status(200).send(openvpnServers);
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

            // disconnect from servers
            await this.disconnect();

            // connect again
            await this.callConnect();

            // return response data
            res.status(200).json({ "message": "OK" });
        } catch (error: any) {
            this.logger.error(`${this.logID}updateConfig >> error = ${error}`);
            res.status(500).send(error);
        }
    }

    private async getStatus(req: Request, res: Response) {
        try {
            // get data
            const body: ServerIdIntf = req.body;
            if (this.debug) {
                this.logger.debug(`${this.logID}getStatus >> body = ${JSON.stringify(body)}`);
            }
            const id: number = body.id;

            // send command
            await this.writeSocket(id, "status 3\r\n"); // Show status information using the format of --status - version 3

            // return OK
            res.status(200).json({ "message": "OK" });
        } catch (error: any) {
            this.logger.error(`${this.logID}getStatus >> error = ${error}`);
            res.status(500).send(error);
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

                }
            }
        } catch (error: any) {
            this.logger.error(`${this.logID}connect >> error = ${error}`);
        }
    }

}
