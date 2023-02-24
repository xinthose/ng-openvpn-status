import { Injectable, Output, EventEmitter, NgZone, Directive } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router } from "@angular/router";

// Progress
import { NotificationService } from '@progress/kendo-angular-notification';

// rxjs
import { firstValueFrom } from "rxjs";
import { webSocket, WebSocketSubject } from "rxjs/webSocket";
import { retry, RetryConfig, catchError } from "rxjs/operators";

// interfaces
import { LoginStatusIntf } from './interfaces/LoginStatusIntf';
import { OpenVPNserversIntf } from "./interfaces/OpenVPNserversIntf";
import { ServerIdIntf } from "./interfaces/ServerIdIntf";

// Other
import { environment } from '../environments/environment';
import { NGXLogger } from 'ngx-logger';
import { DateTime } from "luxon";
import config from "../assets/config.json";
import { IInactivityConfig, InactivityCountdownTimer } from 'inactivity-countdown-timer';

/* #region */
/* #endregion */

/********************************************************************** Localhost Server **********************************************************************/
/* #region */

@Injectable({
  providedIn: "root",
})
export class ServerService {
  private logID: string = "ServerService.";
  private debug: boolean = config.debug;
  public editSource: any;

  constructor(
    private http: HttpClient,
    private logger: NGXLogger,
    private authService: AuthService,
  ) { }

  private async post(route: string, body: Object): Promise<any> {
    // create headers
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Authorization": `Bearer ${this.authService.authToken}`,
      }),
    };

    // build URL
    const url: string = `http://${window.location.hostname}:${config.serverPort}/${route}`;
    if (this.debug) {
      this.logger.debug(`${this.logID}post >> url = ${url}`);
    }

    // make request
    return firstValueFrom(this.http.post(url, body, httpOptions));
  }

  private async get(route: string): Promise<any> {
    // create headers
    const httpOptions = {
      headers: new HttpHeaders({
        "Authorization": `Bearer ${this.authService.authToken}`,
      }),
    };

    // build URL
    const url: string = `http://${window.location.hostname}:${config.serverPort}/${route}`;
    if (this.debug) {
      this.logger.debug(`${this.logID}get >> url = ${url}`);
    }

    // make request
    return firstValueFrom(this.http.get(url, httpOptions));
  }

  public getConfig(): Promise<Array<OpenVPNserversIntf>> {
    return this.get("openvpn/getConfig");
  }

  public updateConfig(openVPNservers: Array<OpenVPNserversIntf>): Promise<null> {
    if (this.debug) {
      this.logger.debug(`${this.logID}updateConfig >> openVPNservers = ${JSON.stringify(openVPNservers)}`);
    }

    return this.post("openvpn/updateConfig", openVPNservers);
  }

}

/* #endregion */
/********************************************************************** Authentication **********************************************************************/
/* #region */

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private logID: string = "AuthService.";
  private debug: boolean = config.debug;
  public authToken: string = "";
  public isLoggedIn: boolean = false;
  public username: string = "";
  inactivityTimer: any;
  // events
  @Output() isLoggedInEvent: EventEmitter<boolean> = new EventEmitter();
  /// active class for navbar
  @Output() homeSelectedEvent: EventEmitter<null> = new EventEmitter();
  @Output() configSelectedEvent: EventEmitter<null> = new EventEmitter();
  @Output() serverSelectedEvent: EventEmitter<null> = new EventEmitter();

  constructor(
    private logger: NGXLogger,
    private notificationService: NotificationService,
    private http: HttpClient,
    private router: Router,
  ) {
    const settings: IInactivityConfig = {
      idleTimeoutTime: config.inactivityLogoutTime,
      windowResetEvents: ["mousemove", "keypress"],
      timeoutCallback: () => {
        if (this.debug) {
          this.logger.debug(`${this.logID} startInactivityTimer >> inactivity limit reached`);
        }

        // show popup
        this.notificationService.show({
          content: "Inactivity limit reached.",
          cssClass: "customToast",
          position: { horizontal: "center", vertical: "top" },
          type: { style: "warning", icon: false },  // none, success, error, warning, info
          hideAfter: 5000,  // milliseconds
          animation: {
            type: "slide",
            duration: 150, // milliseconds (notif)
          },
        });

        // logout
        this.logout();
      },
    };

    this.inactivityTimer = new InactivityCountdownTimer(settings);
  }

  private async post(route: string, body: Object): Promise<any> {
    // create headers
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Authorization": `Bearer ${this.authToken} `,
      }),
    };

    // build URL
    const url: string = `http://${window.location.hostname}:${config.serverPort}/auth/${route}`;
    if (this.debug) {
      this.logger.debug(`${this.logID}post >> url = ${url}`);
    }

    // make request
    return firstValueFrom(this.http.post(url, body, httpOptions));
  }

  public login(username: string, password: string): Promise<LoginStatusIntf> {
    if (this.debug) {
      this.logger.debug(`${this.logID}login >> username = ${username}; password = ${password}`);
    }

    const body = {
      "username": username,
      "password": password,
    };
    return this.post("login", body);
  }

  public logout() {
    // log logout
    this.logger.info(`${this.logID}logout >> user logged out >> username = ${this.username}`);

    // reset
    this.isLoggedIn = false;
    this.authToken = "";
    this.username = "";

    // emit changes
    this.isLoggedInEvent.emit(false);

    // show popup
    this.notificationService.show({
      content: "You have been logged out.",
      cssClass: "customNotification",
      position: { horizontal: "center", vertical: "top" },
      type: { style: "success", icon: false },  // none, success, error, warning, info
      hideAfter: 3000,  // milliseconds
      animation: {
        type: "slide",
        duration: 150, // milliseconds (notif)
      },
    });

    // stop inactivity timer
    this.inactivityTimer.stop();

    // navigate
    this.router.navigate(["login"]);
  }

}

/* #endregion */
/******************************** Web Sockets ********************************/
/* #region */

@Injectable({
  providedIn: "root"
})
export class SocketService {
  private logID: string = "SocketService.";
  private debug: boolean = config.debug;
  private BASE_URL: string = "";
  private retryConfig: RetryConfig = {
    delay: 3000,
  };
  public socket!: WebSocketSubject<any>;
  public event = Event;

  // event emitters
  @Output() wsClosed: EventEmitter<boolean> = new EventEmitter();
  @Output() wsError: EventEmitter<boolean> = new EventEmitter();
  @Output() stationClosed: EventEmitter<boolean> = new EventEmitter();

  constructor(
    private notificationService: NotificationService,
    private logger: NGXLogger,  // trace, debug, info, log, warn, error, fatal
  ) {
    this.BASE_URL = `ws://${window.location.hostname}:${config.serverPort}/`;
  }

  public connect(): void {
    this.logger.info(`${this.logID}connect >> initialize websocket at ${this.BASE_URL}`);

    this.socket = webSocket({
      url: this.BASE_URL,
      openObserver: {
        next: () => {
          this.wsClosed.emit(false);
        }
      },
      closeObserver: {
        next: () => {
          this.wsClosed.emit(true);
        }
      },
    });
    this.socket.pipe(retry(this.retryConfig)).subscribe({
      next: (msg: any) => {  // Called whenever there is a message from the server
        if (this.debug && (msg.event != "flow_updated")) {
          this.logger.debug(`${this.logID}connect >> message received >> msg = ${JSON.stringify(msg)}`);
        }
        this.handleMessage(msg);
      },
      error: (err: any) => {
        this.logger.error(`${this.logID}connect >> websocket error; error = ${err}`);
        this.notificationService.show({
          content: "Websocket error.",
          cssClass: this.config.tenInchScreenUsed ? "notificationTenInchScreen" : "notificationFiveInchScreen",
          position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
          type: { style: "error", icon: false },  // none, success, error, warning, info
          hideAfter: 2000,  // milliseconds
          animation: {
            type: "fade",
            duration: 150, // milliseconds (notif)
          },
        });
      },
      complete: () => { // called when connection is closed (for whatever reason)
        this.logger.error(`${this.logID}connect >> websocket connection closed`);
      }
    });
  }

  private handleMessage(msg: any) {
    const event = msg.event;
    if (this.debug) {
      this.logger.debug(`${this.logID}handleMessage >> message = ${JSON.stringify(msg)}`);
    }

    switch (event) {
      case Events.STATION_CLOSED: {
        this.stationClosed.emit(true);
        break;
      }
      case Events.STATION_OPEN: {
        this.stationClosed.emit(false);
        break;
      }
      case Events.STATION_FAULT: {
        this.stationFault.emit({
          stationFault: true,
          fault: msg.data
        });
        break;
      }
      case Events.STATION_FAULT_CLEARED: {
        this.stationFault.emit({
          stationFault: false,
          fault: msg.data
        });
        break;
      }
      case Events.STATION_RECOVERED: {
        this.stationRecovered.emit(true);
        break;
      }
      case Events.FLOW_UPDATED: {
        this.flowUpdated.emit(msg.data);
        break;
      }
      case Events.TRANSACTION_COMPLETE: {
        this.transComplete.emit(true);
        break;
      }
      case Events.FILL_POINT_1_COMPLETE: {
        this.fillPoint1Complete.emit(true);
        break;
      }
      case Events.FILL_POINT_2_COMPLETE: {
        this.fillPoint2Complete.emit(true);
        break;
      }
      case Events.CARD_SCANNED: {
        this.cardScanned.emit(msg.data);
        break;
      }
      case Events.NO_FLOW_LOGOFF: {
        this.noFLowLogOff.emit(true);
        break;
      }
      case Events.TRANSACTION_TIME_LIMIT: {
        this.transTimeLimit.emit(true);
        break;
      }
      case Events.LOW_PH: {
        this.lowPh.emit(true);
        break;
      }
      case Events.HIGH_PH: {
        this.highPh.emit(true);
        break;
      }
      case Events.SCALE_READ_ERROR: {
        this.scaleReadError.emit(true);
        break;
      }
      case Events.SCALE_READ_OK: {
        this.scaleReadOK.emit(msg.data);
        break;
      }
      case Events.WATER_STOP_PRESSED: {
        this.waterStopPressed.emit();
        break;
      }
      default: {
        this.logger.error(`${this.logID}handleMessage >> event unhandled >> event = ${event}`);
        break;
      }
    }
  }

  public closeSocket(): void {
    this.socket.unsubscribe();
  }

  public sendEvent(event: Events, data?: Object): void {
    if (this.config.designerTesting) {
      return;
    }

    if (this.debug) {
      this.logger.debug(`${this.logID}sendEvent >> event = ${event}; data = ${JSON.stringify(data)}`);
    }

    this.socket.next({
      "event": event.toString(),
      "data": data,
    })
  }
}

/* #endregion */
