// interfaces
import { LoginIntf } from "./interfaces/LoginIntf";
import { LogoutIntf } from "./interfaces/LogoutIntf";
import { VerifyLoginIntf } from "./interfaces/VerifyLoginIntf";

// config
import config from "./serverConfig.json";

// libraries
import express, { Router, Request, Response } from "express";
import winston from 'winston';
import { sign, verify } from "jsonwebtoken";
import { RedisClientType } from 'redis';

export class Authentication {
    private logId: string = "Authentication.";
    private debug: boolean;
    private logger: winston.Logger;
    private redisClient: RedisClientType;
    public router: Router = express.Router();

    constructor(debug: boolean, logger: winston.Logger, redisClient: RedisClientType) {
        // set data
        this.debug = debug;
        this.logger = logger;
        this.redisClient = redisClient;

        this.router.post('/login', [this.login.bind(this)]);
        this.router.post('/logout', [this.logout.bind(this)]);
        this.router.post('/verify', [this.verify.bind(this)]);
    }

    private async login(req: Request, res: Response) {
        try {
            if (this.debug) {
                this.logger.error(`${this.logId}login >> req.body = ${JSON.stringify(req.body)}`);
            }

            // get data
            const data: LoginIntf = req.body;

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
            if (matchFound) {
                // generate access token
                const token: string = sign({ "username": data.username }, config.jsonWebToken.secret, {
                    "expiresIn": config.jsonWebToken.expire
                });

                // return response data
                res.status(200).json({
                    "loginOK": true,
                    "token": token,
                });
            } else {
                res.status(200).json({
                    "loginOK": false,
                    "token": "",
                });
            }
        } catch (error: any) {
            this.logger.error(`${this.logId}login >> error = ${error}`);
            res.status(500).send(error);
        }
    }

    private async logout(req: Request, res: Response) {
        try {
            if (this.debug) {
                this.logger.error(`${this.logId}logout >> req.body = ${JSON.stringify(req.body)}`);
            }

            // get data
            const data: LogoutIntf = req.body;

            // connect to in memory database
            await this.redisClient.connect();

            // push JSON web token into blacklist
            await this.redisClient.LPUSH("blackTokens", data.token);

            // return
            res.sendStatus(200);
        } catch (error: any) {
            this.logger.error(`${this.logId}logout >> error = ${error}`);
            res.status(500).send(error);
        }
    }

    private async verify(req: Request, res: Response) {
        try {
            if (this.debug) {
                this.logger.error(`${this.logId}verify >> req.body = ${JSON.stringify(req.body)}`);
            }

            // get data
            const data: VerifyLoginIntf = req.body;

            // verify token, will throw if there is an error
            verify(data.token, config.jsonWebToken.secret);

            // send response
            res.status(200).send();
        } catch (error: any) {
            this.logger.error(`${this.logId}verify >> error = ${error}`);
            res.status(401).send(error);
        }
    }
}
