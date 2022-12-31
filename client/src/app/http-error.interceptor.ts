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
          let errorMessage = `Error Code: ${error.status}; Message: ${error.message}`;

          // return
          return throwError(() => new Error(errorMessage));
        })
      )
  }
}
