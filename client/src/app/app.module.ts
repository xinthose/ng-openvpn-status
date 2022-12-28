import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

// Forms
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

// General
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

// Progress
import { InputsModule } from '@progress/kendo-angular-inputs';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { LabelModule } from '@progress/kendo-angular-label';
import { NotificationModule } from '@progress/kendo-angular-notification';
import { RippleModule } from '@progress/kendo-angular-ripple';
import { PopupModule } from '@progress/kendo-angular-popup';
import { IndicatorsModule } from '@progress/kendo-angular-indicators';
import { GridModule } from '@progress/kendo-angular-grid';

// MDBootstrap
import { MdbCollapseModule } from "mdb-angular-ui-kit/collapse";

// Other
import { HttpErrorInterceptor } from './http-error.interceptor';
import { LoggerModule, NgxLoggerLevel } from "ngx-logger";
import { environment } from "../environments/environment";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// Components
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { ConfigComponent } from './config/config.component';



@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
    PageNotFoundComponent,
    ConfigComponent
  ],
  imports: [
    // General
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    LoggerModule.forRoot({
      serverLoggingUrl: "",
      level: NgxLoggerLevel.DEBUG,
      serverLogLevel: environment.production ? NgxLoggerLevel.INFO : NgxLoggerLevel.OFF,  // only log to server for production
      httpResponseType: "json",
    }),
    // Forms
    FormsModule,
    ReactiveFormsModule,
    // Progress
    InputsModule,
    ButtonsModule,
    LabelModule,
    NotificationModule,
    RippleModule,
    PopupModule,
    IndicatorsModule,
    DialogsModule,
    GridModule,
    // MDBootstrap
    MdbCollapseModule,
    // other
    FontAwesomeModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true
    },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
