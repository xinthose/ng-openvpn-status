import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

import { AuthService } from './server.service';

@Injectable({
  providedIn: 'root'
})
export class LoggedInGuard implements CanActivate {
  constructor(private authService: AuthService) { }

  canActivate() {
    return !this.authService.isLoggedIn;
  }
}
