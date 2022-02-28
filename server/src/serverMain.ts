// classes
import { Openvpn } from './openvpn';

// config
import config from "./serverConfig.json";

// interfaces
import { WinstonLogLevelsEnum } from "./enum/WinstonLogLevelsEnum";

// axios
import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from "axios";
import { ClientRequest } from "http";

// libraries
import express, { Request, Response, NextFunction } from "express";
import https from 'https';
import compression from "compression";
import { Loggly, LogglyOptions } from "winston-loggly-bulk";
import winston from 'winston';
import fs from "fs";

export class OpenvpnServer {
    private logID: string = "OpenvpnServer.";
    private debug: boolean = config.debug;
    private advDebug: boolean = config.advDebug;
    private app: express.Application;
    private server!: https.Server;
    private port: any = process.env.PORT || config.port;    // default port is 8080; POST requests to HTTPS automatically get routed to this port by the AWS load balancer
    private appFolder: string = "./";
    private appOptions: any = {
        dotfiles: "ignore",
        etag: false,
        extensions: ["html", "js", "scss", "css"],
        index: false,
        maxAge: "1y",
        redirect: true,
    };
    private logOptions: LogglyOptions = {
        token: config.production ? config.loggly.prod.customerToken : config.loggly.dev.customerToken,
        level: config.debug ? WinstonLogLevelsEnum.DEBUG : WinstonLogLevelsEnum.ERROR,
        subdomain: "portapay.com",
        tags: ["Winston-NodeJS"],
        json: true,
    };
    private logger: winston.Logger;
    private sslKey!: Buffer;
    private sslCert!: Buffer;
    private axios: AxiosInstance;
    private appKey: string = "";
    // classes
    private openvpn: Openvpn;

    constructor() {
        // initialize
        this.logger = winston.add(new Loggly(this.logOptions));
        if (config.production) {
            this.appKey = config.kinvey.prod.appKey;
        } else {
            this.appKey = config.kinvey.dev.appKey;
            this.sslKey = fs.readFileSync(config.ssl.dev.key);
            this.sslCert = fs.readFileSync(config.ssl.dev.cert);
        }
        this.axios = axios.create();

        // setup server
        this.app = express();
        this.app.use(express.urlencoded({ extended: true }));   // needed for POST requests
        this.app.use(compression());    // decrease data usage <http://expressjs.com/en/resources/middleware/compression.html>
        this.app.use(express.static(this.appFolder, this.appOptions));  // serve website files
        this.app.disable("x-powered-by");   // prevent attackers from finding out that this app uses express

        // create classes
        this.openvpn = new Openvpn(this.debug, this.logger, this.axios);

        // tell app to use routes, call check_auth for some, and 401 anything falling through
        this.app.use("/openvpn", this.openvpn.router, function (req: Request, res: Response) {
            res.sendStatus(401);
        });

        // serve angular paths (Important: call after all other routes)
        this.app.all("*", (req: Request, res: Response) => {
            res.status(200).sendFile(`/`, { root: this.appFolder });
        });

        // start listening (call last)
        this.server = https.createServer({ key: this.sslKey, cert: this.sslCert }, this.app);
        this.server.listen(this.port, () => {
            this.logger.info(`${this.logID}constructor >> server listening on port ${this.port}`);
        });

        // log
        this.logger.info(`${this.logID}constructor >> app initialized`);
    }

    private async check_auth(req: Request, res: Response, next: NextFunction) {
        let from: string = "";
        try {
            // get data
            const auth: string = req.headers.authorization ?? "";
            from = req.headers.from ?? "";
            if (this.debug) {
                this.logger.debug(`${this.logID}check_auth >> auth = ${auth}; from = ${from}`);
            }

            // make GET request
            const URL: string = `https://ghffhg/user/${this.appKey}/${from}?fields=_id`;
            const axiosRequestConfig: AxiosRequestConfig = {
                "headers": {
                    "Authorization": auth,
                }
            };
            const response: AxiosResponse = await this.axios.get(URL, axiosRequestConfig);
            if (this.debug) {
                this.logger.debug(`${this.logID}check_auth >> response.data = ${JSON.stringify(response.data)}`);
            }

            // return
            return next();
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const errStr = this.getAxiosError(error);
                this.logger.error(`${this.logID}check_auth >> error = ${errStr}; from = ${from}`);
                res.sendStatus(401);
            } else {
                this.logger.error(`${this.logID}check_auth >> error = ${error}`);
                res.sendStatus(401);
            }
            return next("router");
        }
    }

    private getAxiosError(error: AxiosError): string {
        // Documentation <https://github.com/axios/axios#handling-errors>
        let errStr: string = "";
        if (error.response) {
            // The request was made and the server responded with a status code that falls out of the range of 2xx
            errStr = `axios >> data = ${JSON.stringify(error.response.data)}; status = ${error.response.status}; headers = ${JSON.stringify(error.response.headers)}`;
        } else if (error.request) {
            // The request was made but no response was received
            // `error.request` is an instance of XMLHttpRequest in the browser and an instance of http.ClientRequest in node.js
            const err: ClientRequest = error.request;
            errStr = `axios >> request = ${JSON.stringify(err)}`;
        } else {
            // Something happened in setting up the request that triggered an Error
            errStr = `axios >> message = ${error.message}`;
        }

        return errStr;
    }

    public getApp(): express.Application {
        return this.app;
    }

}
