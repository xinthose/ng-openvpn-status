// interfaces

// config
import config from "./serverConfig.json";

// libraries
import express, { Router, Request, Response } from "express";
import winston from 'winston';
import { sign } from "jsonwebtoken";

export class Authentication {
    private logId: string = "Authentication.";
    private debug: boolean;
    private logger: winston.Logger;
    public router: Router = express.Router();

    constructor(debug: boolean, logger: winston.Logger) {
        // set data
        this.debug = debug;
        this.logger = logger;

        this.router.post('/genAccessToken', [this.genAccessToken.bind(this)]);
    }

    private async genAccessToken(req: Request, res: Response) {
        try {
            if (this.debug) {
                this.logger.error(`${this.logId}genAccessToken >> req.body = ${JSON.stringify(req.body)}`);
            }

            // get data
            const data = req.body;

            sign(data.username, config.jsonWebToken.secret, {
                expiresIn: config.jsonWebToken.expireMinutes
            });

            // return response data
            res.status(200);
        } catch (error: any) {
            this.logger.error(`${this.logId}genAccessToken >> error = ${error}`);
            res.status(500).send(error);
        }
    }

}
