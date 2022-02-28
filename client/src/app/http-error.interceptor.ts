import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { retry, catchError } from "rxjs/operators";

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
        //retry(1),
        catchError((error: HttpErrorResponse) => {
          if (this.debug) {
            this.logger.debug("HttpErrorInterceptor.intercept >> error = " + JSON.stringify(error));
          }

          // get error message
          /// check if it is a Stripe error
          let errorMessage = error.message;

          // return
          return throwError(() => new Error(errorMessage))
        })
      )
  }
}
