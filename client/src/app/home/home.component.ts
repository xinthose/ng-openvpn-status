import { Component, OnInit } from '@angular/core';

// Services
import { AuthService } from "../server.service";
import { NotificationService } from "@progress/kendo-angular-notification";

// other
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private logger: NGXLogger,
  ) { }

  ngOnInit(): void {
    // set active class in navbar
    setTimeout(() => {
      this.authService.homeSelectedEvent.emit();
    });
  }

}
