// interfaces

// config
import config from "./serverConfig.json";

// axios
import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from "axios";
import { ClientRequest } from "http";

// libraries
import express, { Router, Request, Response } from "express";
import winston from 'winston';

export class Openvpn {
    private logId: string = "Openvpn.";
    private debug: boolean;
    private logger: winston.Logger;
    public router: Router = express.Router();
    private axios: AxiosInstance;

    constructor(debug: boolean, logger: winston.Logger, axios: AxiosInstance) {
        // set data
        this.debug = debug;
        this.logger = logger;
        this.axios = axios;

        this.router.post('/blank1', [this.blank1.bind(this)]);
    }

    private async blank1(req: Request, res: Response) {
        try {
            if (this.debug) {
                this.logger.error(`${this.logId}blank1 >> req.body = ${JSON.stringify(req.body)}`);
            }

            // return response data
            res.sendStatus(200);
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                const errStr = this.getAxiosError(error);
                this.logger.error(`${this.logId}blank1 >> error = ${error}`);
                res.status(500).send(errStr);
            } else {
                this.logger.error(`${this.logId}blank1 >> error = ${error}`);
                res.status(500).send(error);
            }
        }
    }

    // other

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

}
