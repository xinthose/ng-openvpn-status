import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Title } from "@angular/platform-browser";
import { Location } from "@angular/common";

// services
import { AuthService } from "./server.service";
import { NotificationService } from "@progress/kendo-angular-notification";

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
  // windows / dialogs
  public confirmLogout: boolean = false;
  // navigation selected
  public homeSelected: boolean = false;
  public configSelected: boolean = false;
  // icons
  faUser = faUser;
  faSignOutAlt = faSignOutAlt;
  // subscriptions
  isLoggedIn$!: Subscription;
  homeSelected$!: Subscription;
  configSelected$!: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private logger: NGXLogger,
    private titleService: Title,
    private location: Location,
  ) {
    this.titleService.setTitle(config.appTitle);
  }

  ngAfterViewInit() {
    this.isLoggedIn$ = this.authService.isLoggedInEvent.subscribe((isLoggedIn: boolean) => {
      if (this.debug) {
        this.logger.debug(`${this.logID}isLoggedInEvent >> isLoggedIn = ${isLoggedIn}`);
      }

      // set logged in status
      this.isLoggedIn = isLoggedIn;

      // handle status
      if (isLoggedIn) {
        this.username = this.authService.username;
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
  }

  ngOnDestroy() {
    this.isLoggedIn$.unsubscribe();
    this.homeSelected$.unsubscribe();
    this.configSelected$.unsubscribe();
  }

}
