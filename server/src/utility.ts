// interfaces

// config
import config from "./serverConfig.json";

// libraries
import express, { Router, Request, Response } from "express";
import winston from 'winston';

export class Utility {
    private logID: string = "Utility.";
    private debug: boolean = config.debug;
    private logger: winston.Logger;
    public router: Router = express.Router();

    constructor(logger: winston.Logger) {
        // set data
        this.logger = logger;

        this.router.get('/health_check', [this.health_check.bind(this)]);
    }

    private async health_check(req: Request, res: Response) {
        res.sendStatus(200);
    }

}
