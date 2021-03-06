import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

// services
import { NotificationService } from '@progress/kendo-angular-notification';

// other
import { NGXLogger } from 'ngx-logger';
import config from "../assets/config.json";

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private debug: boolean = config.debug;

  constructor(
    private notificationService: NotificationService,
    private logger: NGXLogger,  // trace, debug, info, log, warn, error, fatal
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          // get error message
          let errorMessage = "";
          if (error.error instanceof ErrorEvent) {  // client-side error
            errorMessage = "Error: " + error.error.message;
          } else {  // server-side error
            errorMessage = "Error Code: " + error.status.toString() + "; Message: " + error.message;
          }

          // show popup
          this.notificationService.show({
            content: errorMessage,
            cssClass: "customNotification",
            position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
            type: { style: "error", icon: false },  // none, success, error, warning, info
            closable: true,
            animation: {
              type: "fade",
              duration: 150, // milliseconds (notif)
            },
          });

          // return
          return throwError(() => new Error(errorMessage));
        })
      )
  }
}
