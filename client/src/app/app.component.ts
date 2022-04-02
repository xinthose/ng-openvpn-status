import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { Title } from "@angular/platform-browser";

// services
import { AuthService } from "./server.service";
import { NotificationService } from "@progress/kendo-angular-notification";

// rxjs
import { Subscription } from "rxjs";

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
  public userName: string = "";
  // navigation selected
  public homeSelected: boolean = false;
  // subscriptions
  isLoggedIn$!: Subscription;
  homeSelected$!: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private logger: NGXLogger,
    private titleService: Title,
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
        this.userName = this.authService.username;
      } else {
        this.userName = "";
      }
    });

    this.homeSelected$ = this.authService.homeSelectedEvent.subscribe(() => {
      this.resetSelection();
      this.homeSelected = true;
    });
  }

  private resetSelection(): void {
    this.homeSelected = false;
  }

  ngOnDestroy() {
    this.isLoggedIn$.unsubscribe();
    this.homeSelected$.unsubscribe();
  }

}
