import { Component, OnInit } from "@angular/core";

// services
import { NotificationService } from "@progress/kendo-angular-notification";
import { AuthService, ServerService } from "../server.service";

// Other
import { NGXLogger } from 'ngx-logger';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../environments/environment';
import config from "../../assets/config.json";

@Component({
  selector: 'app-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.scss']
})
export class ServerComponent implements OnInit {
  private debug: boolean = config.debug;
  private logID: string = "ServerComponent.";

  constructor(
    private authService: AuthService,
    private logger: NGXLogger,
  ) {
  }

  async ngOnInit() {
    try {
      // set active class in navbar
      setTimeout(() => {
        this.authService.serverSelectedEvent.emit();
      });
    } catch (error: any) {
      this.logger.error("ConfigComponent.ngAfterViewChecked >> error = " + error);
    }
  }

}
