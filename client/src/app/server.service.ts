import { Injectable, Output, EventEmitter, NgZone, Directive } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router } from "@angular/router";

// Progress
import { NotificationService } from '@progress/kendo-angular-notification';

// rxjs
import { firstValueFrom } from "rxjs";

// interfaces
import { LoginStatusIntf } from './interfaces/LoginStatus.interface';
import { OpenVPNserversIntf } from "./interfaces/OpenVPNservers.interface";

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
          this.logger.debug(`${this.logID}startInactivityTimer >> inactivity limit reached`);
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
        "Authorization": `Bearer ${this.authToken}`,
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
