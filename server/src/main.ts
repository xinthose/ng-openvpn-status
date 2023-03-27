// classes
import { Openvpn } from "./openvpn";
import { Authentication } from "./auth";
import { Utility } from "./utility";

// config
import config from "./serverConfig.json";

// interfaces
import { WinstonLogLevelsEnum } from "./enum/WinstonLogLevelsEnum";
import { WSeventIntf } from './interfaces/websocket/WSeventIntf';
import { Event } from './enum/Event';
import { WSbyteCountIntf } from "./interfaces/websocket/WSbyteCountIntf";
import { WSstatusIntf } from "./interfaces/websocket/WSstatusIntf";
import { WSroutingTableIntf } from "./interfaces/websocket/WSroutingTableIntf";
import { WSserverTimeIntf } from "./interfaces/websocket/WSserverTimeIntf";

// libraries
import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import winston, { LoggerOptions, level, format } from "winston";
import { verify } from "jsonwebtoken";
import cors from "cors";
import * as WebSocket from 'ws';
import * as http from "http";
import { EventEmitter } from "events";

export class Main {
    private logID: string = "Main.";
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
    };
    private logger: winston.Logger;
    private server: http.Server;
    private wss: WebSocket.Server;
    private eventEmitter: EventEmitter = new EventEmitter();
    // classes
    private openvpn: Openvpn;
    private auth: Authentication;
    private utility: Utility;

    constructor() {
        // initialize
        this.logger = winston.createLogger(this.loggerOptions);

        // setup server
        this.app = express();
        this.app.use(cors()); // cross origin resource sharing
        this.app.use(express.json()); // needed for POST requests with JSON in the body
        this.app.use(express.urlencoded({ extended: true }));   // needed for POST requests
        this.app.use(compression());    // decrease data usage <http://expressjs.com/en/resources/middleware/compression.html>
        this.app.use(express.static(this.appFolder, this.appOptions));  // serve website files
        this.app.disable("x-powered-by");   // prevent attackers from finding out that this app uses express

        // create classes
        this.openvpn = new Openvpn(this.logger, this.eventEmitter);
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

        // create server
        this.server = http.createServer(this.app);

        // create the WebSocket server
        this.wss = new WebSocket.Server({
            server: this.server,
        });
        this.setupWS();

        // tell server to listen (including web socket)
        this.server.listen(this.port, () => {
            this.logger.info(`${this.logID}constructor >> Running http server on port ${this.port}`);
        }).on("error", (err: Error) => {
            this.logger.error(`${this.logID}http server listen error = message = ${err.message}`);
        });

        // log
        this.logger.info(`${this.logID}constructor >> app initialized`);
    }

    // utility

    private setupWS() {
        this.wss.on("connection", (ws: WebSocket, req: any) => {
            // get IP address of client
            const ip: string = req.socket.remoteAddress;

            // log
            this.logger.info(`${this.logID}setupWS >> client connected >> IP address = ${ip}`);

            // listen for events in sub-classes
            this.eventEmitter.on(Event.SOCKET_ERROR, (serverID: number) => {
                const data: WSeventIntf = {
                    "event": Event.SOCKET_ERROR,
                    "message": serverID,
                }
                ws.send(JSON.stringify(data));
            });
            this.eventEmitter.on(Event.SOCKET_CLOSE, (serverID: number) => {
                const data: WSeventIntf = {
                    "event": Event.SOCKET_CLOSE,
                    "message": serverID,
                }
                ws.send(JSON.stringify(data));
            });
            this.eventEmitter.on(Event.SOCKET_TIMEOUT, (serverID: number) => {
                const data: WSeventIntf = {
                    "event": Event.SOCKET_TIMEOUT,
                    "message": serverID,
                }
                ws.send(JSON.stringify(data));
            });
            this.eventEmitter.on(Event.BYTECOUNT_CLI, (data: WSbyteCountIntf) => {
                const sendData: WSeventIntf = {
                    "event": Event.BYTECOUNT_CLI,
                    "message": data,
                }
                ws.send(JSON.stringify(sendData));
            });
            this.eventEmitter.on(Event.CLIENT_LIST, (data: WSstatusIntf) => {
                const sendData: WSeventIntf = {
                    "event": Event.CLIENT_LIST,
                    "message": data,
                }
                ws.send(JSON.stringify(sendData));
            });
            this.eventEmitter.on(Event.ROUTING_TABLE, (data: WSroutingTableIntf) => {
                const sendData: WSeventIntf = {
                    "event": Event.ROUTING_TABLE,
                    "message": data,
                }
                ws.send(JSON.stringify(sendData));
            });
            this.eventEmitter.on(Event.SERVER_TIME, (data: WSserverTimeIntf) => {
                const sendData: WSeventIntf = {
                    "event": Event.SERVER_TIME,
                    "message": data,
                }
                ws.send(JSON.stringify(sendData));
            });

            // listen for events from clients
            ws.on("message", (message: string) => {
                if (this.debug) {
                    this.logger.debug(`${this.logID}setupWS >> client message received >> message = ${message}`);
                }

                // get data
                let data: WSeventIntf;
                try {
                    data = JSON.parse(message);
                } catch (error: any) {
                    this.logger.error(`${this.logID}setupWS >> JSON.parse error on client message >> message = ${message}`);
                    return;
                }

                // handle data
                switch (data.event) {
                    case "newClient":
                        this.logger.info(`${this.logID}setupWS >> new client >> IP = ${data.message}`);
                        break;
                    default:
                        break;
                }
            });
            ws.on("close", () => {
                this.logger.info(`${this.logID}setupWS >> client disconnected`);
            });
            ws.on("error", (error: Error) => {
                this.logger.info(`${this.logID}setupWS >> client error = error = ${error.message}`);
            });
        });
    }

    // other

    public shutdownServer(): Promise<void> {
        return new Promise((resolve, reject) => {
            // shutdown server
            this.server.close((err: Error | undefined) => {
                if (err) {
                    this.logger.error(`${this.logID}shutdownServer >> server.close >> error = ${err.message}`);
                } else {
                    this.logger.info(`${this.logID}shutdownServer >> http server shutdown`);
                }

                // close websocket server
                this.wss.close((err: Error | undefined) => {
                    if (err) {
                        this.logger.error(`${this.logID}shutdownServer >> wss.close >> error = ${err.message}`);
                    } else {
                        this.logger.info(`${this.logID}shutdownServer >> websocket server shutdown`);
                    }

                    // return
                    resolve();
                });
            });
        });
    }

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
