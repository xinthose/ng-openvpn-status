import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Title } from "@angular/platform-browser";
import { Location } from "@angular/common";

// services
import { AuthService, ServerService } from "./server.service";
import { NotificationService } from "@progress/kendo-angular-notification";

// interfaces
import { OpenVPNserversIntf } from "./interfaces/OpenVPNserversIntf";

// rxjs
import { Subscription } from "rxjs";

// icons
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

// other
import { NGXLogger } from 'ngx-logger';
import { environment } from "../environments/environment";
import config from "../assets/config.json";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private debug: boolean = config.debug;
  private logID: string = "AppComponent.";
  public isLoggedIn: boolean = false;
  public appTitle: string = config.appTitle;
  public username: string = "";
  // loading
  public configLoading: boolean = false;
  // data
  public openVPNservers: Array<OpenVPNserversIntf> = [];
  // windows / dialogs
  public confirmLogout: boolean = false;
  // navigation selected
  public homeSelected: boolean = false;
  public configSelected: boolean = false;
  public serverSelected: boolean = false;
  // icons
  faUser = faUser;
  faSignOutAlt = faSignOutAlt;
  // subscriptions
  isLoggedIn$!: Subscription;
  homeSelected$!: Subscription;
  configSelected$!: Subscription;
  serverSelected$!: Subscription;

  constructor(
    private authService: AuthService,
    private serverService: ServerService,
    private notificationService: NotificationService,
    private logger: NGXLogger,
    private titleService: Title,
    private location: Location,
  ) {
    // set title of webpage
    this.titleService.setTitle(config.appTitle);


    this.isLoggedIn$ = this.authService.isLoggedInEvent.subscribe((isLoggedIn: boolean) => {
      if (this.debug) {
        this.logger.debug(`${this.logID}constructor >> isLoggedIn = ${isLoggedIn}`);
      }

      // set logged in status
      this.isLoggedIn = isLoggedIn;

      // handle status
      if (isLoggedIn) {
        this.username = this.authService.username;

        // get content for servers dropdown
        this.getConfig();
      } else {
        this.username = "";
      }
    });

    // set active link
    this.homeSelected$ = this.authService.homeSelectedEvent.subscribe(() => {
      this.resetNavSelected();
      this.homeSelected = true;
    });
    this.configSelected$ = this.authService.configSelectedEvent.subscribe(() => {
      this.resetNavSelected();
      this.configSelected = true;
    });
    this.serverSelected$ = this.authService.serverSelectedEvent.subscribe(() => {
      this.resetNavSelected();
      this.serverSelected = true;
    });
  }

  ngAfterViewInit() {

  }

  async getConfig() {
    try {
      // show loading icon
      this.configLoading = true;

      // get servers from YAML config file
      this.openVPNservers = await this.serverService.getConfig();
      if (this.debug) {
        this.logger.debug(`${this.logID}getConfig >> openVPNservers = ${JSON.stringify(this.openVPNservers)}`);
      }

      // hide loading icon
      this.configLoading = false;
    } catch (error: any) {
      this.configLoading = false;
      this.logger.error(`${this.logID}getConfig >> error = ${error}`);
      this.notificationService.show({
        content: error.toString(),
        closable: true,
        cssClass: "notification",
        position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
        type: { style: "error", icon: false },  // none, success, error, warning, info
        hideAfter: 10000,  // milliseconds
        animation: {
          type: "fade",
          duration: 150, // milliseconds (notif)
        },
      });
    }
  }

  // navigation

  back() {
    this.location.back();
  }

  public logoutButtonClicked() {
    this.confirmLogout = true;
  }

  public closeLogout(status: any) {
    switch (status) {
      case "cancel": {
        this.confirmLogout = false;
        break;
      }
      case "no": {
        this.confirmLogout = false;
        break;
      }
      case "yes": {
        // close dialog
        this.confirmLogout = false;

        this.authService.logout();

        break;
      }
      default:
        break;
    }
  }

  // utility

  private resetNavSelected(): void {
    this.homeSelected = false;
    this.configSelected = false;
    this.serverSelected = false;
  }

  ngOnDestroy() {
    this.isLoggedIn$.unsubscribe();
    this.homeSelected$.unsubscribe();
    this.configSelected$.unsubscribe();
    this.serverSelected$.unsubscribe();
  }

}
