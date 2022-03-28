import { Injectable, Output, EventEmitter, NgZone, Directive } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router } from "@angular/router";

// Progress
import { NotificationService } from '@progress/kendo-angular-notification';

// rxjs
import { firstValueFrom } from "rxjs";

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
  private debug: boolean = config.debug;
  public editSource: any;

  constructor(
    private http: HttpClient,
    private logger: NGXLogger,
  ) { }

  private async post(url: string, body: Object): Promise<any> {
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
  private authToken: string = "";
  public isLoggedIn: boolean = false;
  inactivityTimer: any;
  // events
  @Output() isLoggedInEvent: EventEmitter<boolean> = new EventEmitter();
  // events: active class for navbar
  @Output() homeSelectedEvent: EventEmitter<null> = new EventEmitter();

  constructor(
    private router: Router,
    private logger: NGXLogger,
    private notificationService: NotificationService,
    private http: HttpClient,
  ) {
    const settings: IInactivityConfig = {
      idleTimeoutTime: config.inactivityLogoutTime,
      windowResetEvents: ["mousemove", "keypress"],
      timeoutCallback: () => {
        if (this.debug) {
          this.logger.debug("AuthService.startInactivityTimer >> inactivity limit reached");
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
      })
    };

    // build URL
    const url: string = `${window.location.hostname}/auth/${route}`;

    // make request
    return firstValueFrom(this.http.post(url, body, httpOptions));
  }

  public async login(username: string, password: string): Promise<any> {
    try {
      if (this.debug) {
        this.logger.debug(`${this.logID}login >> username = ${username}; password = ${password}`);
      }

      const body = {
        "username": username,
        "password": password,
      };
      return this.post("login", body);

    } catch (error: any) {
      const msg = JSON.stringify(error.message, Object.getOwnPropertyNames(error));
      this.logger.error("AuthService.login error >> error.message = " + msg);
      throw new Error(msg);
    }
  }

  public async logout(): Promise<any> {
    try {
    } catch (error: any) {
      const msg = JSON.stringify(error.message, Object.getOwnPropertyNames(error));
      this.logger.error("AuthService.logout error >> error.message = " + msg);
      throw new Error(msg);
    }
  }

}

/* #endregion */
