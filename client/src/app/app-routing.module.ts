import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from './auth.guard';
import { LoggedInGuard } from './logged-in.guard';

// Components
import { LoginComponent } from './login/login.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { HomeComponent } from './home/home.component';
import { ConfigComponent } from './config/config.component';

const routes: Routes = [
  { path: "", redirectTo: "/login", pathMatch: "full" },

  // not logged in
  { path: "login", component: LoginComponent, canActivate: [LoggedInGuard] },

  // logged in
  { path: "home", component: HomeComponent, canActivate: [AuthGuard] },
  { path: "config", component: ConfigComponent, canActivate: [AuthGuard] },

  // catch all (keep this last)
  { path: "**", component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
