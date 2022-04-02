import { Component, OnInit, ElementRef, HostListener, ViewChild, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

// Services
import { AuthService } from "../server.service";

// Progress
import { NotificationService } from "@progress/kendo-angular-notification";

// rxjs
import { Subscription } from "rxjs";

// interfaces
import { LoginStatusIntf } from '../interfaces/loginStatusIntf';

// Other
import { NGXLogger } from 'ngx-logger';
import { environment } from '../../environments/environment';
import config from "../../assets/config.json";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  private debug: boolean = config.debug;
  private logID: string = "LoginComponent.";
  public loading: boolean = false;
  public loginFailed: boolean = false;
  public appTitle: string = config.appTitle;
  // html children
  @ViewChild("submitButton", { static: false }) public submitButton!: ElementRef;
  @ViewChild("popup", { read: ElementRef, static: false }) public popup!: ElementRef;
  // forms
  public LoginForm: FormGroup;
  // subscriptions
  homeSelected$!: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    // private socketService: SocketService,
    private logger: NGXLogger,
    private formBuilder: FormBuilder,
    private notificationService: NotificationService,
  ) {
    this.LoginForm = this.formBuilder.group({
      Username: ["", Validators.required],
      Password: ["", Validators.required],
    });
  }

  ngOnInit(): void {
    // auto login
    if (!environment.production) {
      if (config.autoLogin) {
        setTimeout(() => {
          // set values
          this.LoginForm.setValue({
            Username: "admin",
            Password: "admin",
          });
        }, 100);
        setTimeout(() => {
          // submit form
          const submitButton: HTMLElement = this.submitButton.nativeElement as HTMLElement;
          submitButton.click();
        }, 200);
      }
    }
  }

  // login

  async onSubmit(e: any) {
    try {
      if (this.debug) {
        this.logger.debug(`${this.logID}onSubmit >> e.value = ${JSON.stringify(e.value)}`);
      }

      this.loading = true;

      // login
      const response: LoginStatusIntf = await this.authService.login(e.value["Username"], e.value["Password"])
      if (this.debug) {
        this.logger.debug(`${this.logID}onSubmit >> response = ${JSON.stringify(response)}`);
      }

      if (response.loginOK) {
        // set login success
        this.authService.username = e.value["Username"];
        this.authService.isLoggedIn = true;

        // emit event
        this.authService.isLoggedInEvent.emit(true);

        // start inactivity timer
        this.authService.inactivityTimer.start();

        // show popup
        this.notificationService.show({
          content: "Welcome.",
          cssClass: "customNotification",
          position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
          type: { style: "success", icon: false },  // none, success, error, warning, info
          hideAfter: 3000,
          animation: {
            type: "fade",
            duration: 150, // milliseconds (notif)
          },
        });

        // navigate
        this.router.navigate(["home"]);
      } else {
        this.loginFailed = true;
      }


      this.loading = false;
    } catch (error: any) {
      this.logger.error(`${this.logID}onSubmit >> error = ${error}`);
      this.loading = false;
    }
  }

  public loginFailedOpen() {
    // automatically close popup
    setTimeout(() => {
      this.loginFailed = false;
    }, 2000);
  }

  ngOnDestroy() {
    if (this.debug) {
      this.logger.debug(`${this.logID}ngOnDestroy >> view destroyed`);
    }
  }
}
