// interfaces
import { OpenVPNserversIntf } from "./interfaces/OpenVPNservers.interface";

// config
import config from "./serverConfig.json";

// libraries
import express, { Router, Request, Response } from "express";
import winston from "winston";
import { parse, stringify } from "yaml";
import fs from "fs";

export class Openvpn {
    private logId: string = "Openvpn.";
    private debug: boolean = config.debug;
    private localhostTesting: boolean = config.localhostTesting;
    private logger: winston.Logger;
    public router: Router = express.Router();
    private fsPromises: any = fs.promises;

    constructor(logger: winston.Logger) {
        // set data
        this.logger = logger;

        this.router.get("/getConfig", [this.getConfig.bind(this)]);
        this.router.post("/updateConfig", [this.updateConfig.bind(this)]);
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
                this.logger.error(`${this.logId}getConfig >> config = ${JSON.stringify(config)}`);
            }

            // return response data
            res.status(200).send(config);
        } catch (error: any) {
            this.logger.error(`${this.logId}getConfig >> error = ${error}`);
            res.status(500).send(error);
        }
    }

    private async updateConfig(req: Request, res: Response) {
        try {
            // get data
            const openVPNservers: Array<OpenVPNserversIntf> = req.body;
            if (this.debug) {
                this.logger.debug(`${this.logId}updateConfig >> openVPNservers = ${JSON.stringify(openVPNservers)}`);
            }

            // convert it to a YAML string
            const yamlStr: string = stringify(openVPNservers);
            if (this.debug) {
                this.logger.debug(`${this.logId}updateConfig >> yamlStr = ${yamlStr}`);
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
            this.logger.error(`${this.logId}updateConfig >> error = ${error}`);
            res.status(500).send(error);
        }
    }
}
