import { Component, OnInit } from '@angular/core';

// other
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-page-not-found',
  templateUrl: './page-not-found.component.html',
  styleUrls: ['./page-not-found.component.scss']
})
export class PageNotFoundComponent implements OnInit {

  constructor(
    private logger: NGXLogger,  // trace, debug, info, log, warn, error, fatal
  ) { }

  ngOnInit(): void {
    this.logger.error("page not found");
  }

}
