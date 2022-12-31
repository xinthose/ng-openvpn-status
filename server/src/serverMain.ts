// classes
import { Openvpn } from "./openvpn";
import { Authentication } from "./auth";
import { Utility } from "./utility";

// config
import config from "./serverConfig.json";

// interfaces
import { WinstonLogLevelsEnum } from "./enum/WinstonLogLevelsEnum";

// libraries
import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import winston, { LoggerOptions, level, format } from "winston";
import fs from "fs";
import { verify } from "jsonwebtoken";
import cors from "cors";
import { Telnet } from "telnet-client";

export class OpenvpnServer {
    private logID: string = "OpenvpnServer.";
    private debug: boolean = config.debug;
    private advDebug: boolean = config.advDebug;
    private app: express.Application;
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
    private loggerOptions: LoggerOptions = {
        level: config.debug ? WinstonLogLevelsEnum.DEBUG : WinstonLogLevelsEnum.ERROR,
        format: format.combine(
            format.timestamp(),
            format.json(),
        ),
        transports: [
            new winston.transports.File({
                "filename": config.production ? config.logging.prod.filename : config.logging.dev.filename,
                "maxsize": config.production ? config.logging.prod.maxSize : config.logging.dev.maxSize,
                "maxFiles": config.production ? config.logging.prod.maxFiles : config.logging.dev.maxFiles,
                "zippedArchive": config.production ? config.logging.prod.zippedArchive : config.logging.dev.zippedArchive,
                "options": config.production ? {} : { flags: "w" }, // overwrite log file for testing
            }),
        ],
    }
    private logger: winston.Logger;
    private telnet: Telnet;
    // classes
    private openvpn: Openvpn;
    private auth: Authentication;
    private utility: Utility;

    constructor() {
        // initialize
        this.logger = winston.createLogger(this.loggerOptions);
        this.telnet = new Telnet();

        // setup server
        this.app = express();
        this.app.use(cors()); // cross origin resource sharing
        this.app.use(express.json()); // needed for POST requests with JSON in the body
        this.app.use(express.urlencoded({ extended: true }));   // needed for POST requests
        this.app.use(compression());    // decrease data usage <http://expressjs.com/en/resources/middleware/compression.html>
        this.app.use(express.static(this.appFolder, this.appOptions));  // serve website files
        this.app.disable("x-powered-by");   // prevent attackers from finding out that this app uses express

        // create classes
        this.openvpn = new Openvpn(this.logger, this.telnet);
        this.auth = new Authentication(this.logger);
        this.utility = new Utility(this.logger);

        // tell app to use routes, call checkAuth for some, and 401 anything falling through
        this.app.use("/openvpn", this.checkAuth.bind(this), this.openvpn.router, function (req: Request, res: Response) {
            res.sendStatus(401);
        });
        this.app.use("/auth", this.auth.router, function (req: Request, res: Response) {
            res.sendStatus(401);
        });
        this.app.use("/utility", this.utility.router, function (req: Request, res: Response) {
            res.sendStatus(401);
        });

        // serve angular paths (Important: call after all other routes)
        this.app.all("*", (req: Request, res: Response) => {
            res.status(200).sendFile(`/`, { root: this.appFolder });
        });

        // start listening (call last)
        this.app.listen(this.port, () => {
            this.logger.info(`${this.logID}constructor >> server listening on port ${this.port}`);
        });


        // log
        this.logger.info(`${this.logID}constructor >> app initialized`);
    }


    // utility

    private async checkAuth(req: Request, res: Response, next: NextFunction) {
        let from: string = "";
        try {
            // get data (Authorization: Bearer JWT_ACCESS_TOKEN)
            let token: string = "";
            const authHeader: string = req.headers.authorization ?? "";
            if (authHeader) {
                const authHeaderArr: Array<string> = authHeader.split(" ");
                if (authHeaderArr.length) {
                    if (authHeaderArr.length > 1) {
                        token = authHeaderArr[1];
                    }
                }
            }
            if (this.debug) {
                this.logger.debug(`${this.logID}checkAuth >> token = ${token}`);
            }

            // verify JSON web token
            verify(token, config.jsonWebToken.secret, (error: any, user: any) => {
                if (error) {
                    this.logger.error(`${this.logID}checkAuth >> error = ${error}`);
                    res.sendStatus(403);
                    return next("router");
                } else {
                    return next();
                }
            });
        } catch (error: any) {
            this.logger.error(`${this.logID}checkAuth >> error = ${error}`);
            res.status(401).json({
                "message": error,
            });
            return next("router");
        }
    }

    public getApp(): express.Application {
        return this.app;
    }

}
