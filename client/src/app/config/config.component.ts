import { Component, OnInit } from '@angular/core';

// Services
import { AuthService } from "../server.service";
import { NotificationService } from "@progress/kendo-angular-notification";

// other
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private logger: NGXLogger,
  ) { }

  ngOnInit(): void {
    // set active class in navbar
    setTimeout(() => {
      this.authService.configSelectedEvent.emit();
    });
  }

}
