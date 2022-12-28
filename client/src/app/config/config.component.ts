import { Component, OnInit } from '@angular/core';

// Services
import { AuthService, ServerService } from "../server.service";
import { NotificationService } from "@progress/kendo-angular-notification";

// Other
import { NGXLogger } from 'ngx-logger';
import { environment } from '../../environments/environment';
import config from "../../assets/config.json";

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  private debug: boolean = config.debug;
  private logID: string = "LoginComponent.";
  public loading: boolean = false;

  constructor(
    private authService: AuthService,
    private serverService: ServerService,
    private notificationService: NotificationService,
    private logger: NGXLogger,
  ) { }

  async ngOnInit() {
    try {
      // set active class in navbar
      setTimeout(() => {
        this.authService.configSelectedEvent.emit();
      });

      const response = await this.serverService.getConfig();
      if (this.debug) {
        this.logger.debug(`${this.logID}ngOnInit >> getConfig >> response = ${JSON.stringify(response)}`);
      }

    } catch (error: any) {
      this.logger.error(`${this.logID}ngOnInit >> error = ${error}`);
      this.loading = false;
    }
  }

}
