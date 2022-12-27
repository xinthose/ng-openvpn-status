// interfaces

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
    }

    private async getConfig(req: Request, res: Response) {
        try {
            // get yaml file
            const file = await this.fsPromises.readFile("./openVPNservers.yml", "utf8");

            // parse the file
            const config = await parse(file);

            // return response data
            res.status(200).send(config);
        } catch (error: any) {
            this.logger.error(`${this.logId}getConfig >> error = ${error}`);
            res.status(500).send(error);
        }
    }

}
