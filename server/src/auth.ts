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

        this.router.post('/login', [this.login.bind(this)]);
    }

    private async login(req: Request, res: Response) {
        try {
            if (this.debug) {
                this.logger.error(`${this.logId}login >> req.body = ${JSON.stringify(req.body)}`);
            }

            // get data
            const data = req.body;

            // check for a matching login
            let matchFound: boolean = false;
            for (const user of config.users) {
                if (data.username == user.username) {
                    if (data.password == user.password) {
                        matchFound = true;
                    }
                    break;
                }
            }

            // handle match found
            if (!matchFound) {
                res.sendStatus(401);
                return;
            }

            // generate access token
            const token: string = sign({ "username": data.username }, config.jsonWebToken.secret, {
                "expiresIn": config.jsonWebToken.expire
            });

            // return response data
            res.status(200).json({
                "token": token,
            });
        } catch (error: any) {
            this.logger.error(`${this.logId}login >> error = ${error}`);
            res.status(500).send(error);
        }
    }

}
