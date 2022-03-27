// interfaces

// config
import config from "./serverConfig.json";

// axios
import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from "axios";
import { ClientRequest } from "http";

// libraries
import express, { Router, Request, Response } from "express";
import winston from 'winston';

export class Utility {
    private logId: string = "Utility.";
    private debug: boolean;
    private logger: winston.Logger;
    public router: Router = express.Router();

    constructor(debug: boolean, logger: winston.Logger) {
        // set data
        this.debug = debug;
        this.logger = logger;

        this.router.get('/health_check', [this.health_check.bind(this)]);
    }

    private async health_check(req: Request, res: Response) {
        res.sendStatus(200);
    }

}
