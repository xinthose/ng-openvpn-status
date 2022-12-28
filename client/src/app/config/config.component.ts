


import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

// services
import { NotificationService } from "@progress/kendo-angular-notification";
import { AuthService, ServerService } from "../server.service";

// progress
import { GridDataResult } from "@progress/kendo-angular-grid";
import { SortDescriptor, orderBy } from "@progress/kendo-data-query";
import { formatNumber } from '@progress/kendo-intl';

// interfaces
import { OpenVPNserversIntf } from "../interfaces/OpenVPNservers.interface";
import { OpenVPNserversGridIntf } from "../interfaces/OpenVPNserversGrid.interface";

// Icons
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';

// Other
import { NGXLogger } from 'ngx-logger';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../environments/environment';
import config from "../../assets/config.json";

@Component({
  selector: "app-config",
  templateUrl: "./config.component.html",
  styleUrls: ["./config.component.scss"],
})
export class ConfigComponent implements OnInit {
  private debug: boolean = config.debug;
  private logID: string = "LoginComponent.";
  public configLoading: boolean = false;
  public submitLoading: boolean = false;
  private ipRegex: RegExp = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // interfaces grid
  public OpenVPNserversGridForm!: FormGroup;
  public openVPNserversGridSort: SortDescriptor[] = [
    {
      field: "name",
      dir: "asc"
    }
  ];
  openVPNserversGridData: Array<OpenVPNserversGridIntf> = [];
  openVPNserversGridRow: number = 0;
  // icons
  faPencilAlt = faPencilAlt;
  faCircleQuestion = faCircleQuestion;

  constructor(
    private authService: AuthService,
    private serverService: ServerService,
    private notificationService: NotificationService,
    private logger: NGXLogger,
    private formBuilder: FormBuilder,
  ) {
  }

  async ngOnInit() {
    try {
      // set active class in navbar
      setTimeout(() => {
        this.authService.configSelectedEvent.emit();
      });

      // get eBox network
      await this.getConfig();
    } catch (error: any) {
      this.logger.error("ConfigComponent.ngAfterViewChecked >> error = " + error);
    }
  }

  async getConfig() {
    try {
      // show loading icon
      this.configLoading = true;

      // get servers from YAML config file
      const openVPNservers: Array<OpenVPNserversIntf> = await this.serverService.getConfig();
      if (this.debug) {
        this.logger.debug(`${this.logID}getConfig >> openVPNservers = ${JSON.stringify(openVPNservers)}`);
      }

      // clear current grid data
      this.openVPNserversGridData = [];

      // fill grid data
      for (const openVPNserver of openVPNservers) {
        this.openVPNserversGridData.push({
          "guid": uuidv4(),
          "name": openVPNserver.name,
          "host": openVPNserver.host,
          "port": openVPNserver.port,
          "passwordPrompt": openVPNserver.passwordPrompt,
          "timeout": openVPNserver.timeout,
        })
      }

      // show popup
      this.notificationService.show({
        content: "Data refreshed.",
        cssClass: "notification",
        position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
        type: { style: "success", icon: false },  // none, success, error, warning, info
        hideAfter: 2000,  // milliseconds
        animation: {
          type: "fade",
          duration: 150, // milliseconds (notif)
        },
      });

      // hide loading icon
      this.configLoading = false;
    } catch (error: any) {
      this.configLoading = false;
      this.logger.error(`${this.logID}getConfig >> error = ${error}`);
      this.notificationService.show({
        content: error.toString(),
        closable: true,
        cssClass: "notification",
        position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
        type: { style: "error", icon: false },  // none, success, error, warning, info
        hideAfter: 10000,  // milliseconds
        animation: {
          type: "fade",
          duration: 150, // milliseconds (notif)
        },
      });
    }
  }

  async submitConfig() {
    try {
      // show loading icon
      this.submitLoading = true;

      // get servers from YAML config file
      const openVPNservers: Array<OpenVPNserversIntf> = await this.serverService.getConfig();
      if (this.debug) {
        this.logger.debug(`${this.logID}getConfig >> openVPNservers = ${JSON.stringify(openVPNservers)}`);
      }

      // clear current grid data
      this.openVPNserversGridData = [];

      // fill grid data
      for (const openVPNserver of openVPNservers) {
        this.openVPNserversGridData.push({
          "guid": uuidv4(),
          "name": openVPNserver.name,
          "host": openVPNserver.host,
          "port": openVPNserver.port,
          "passwordPrompt": openVPNserver.passwordPrompt,
          "timeout": openVPNserver.timeout,
        })
      }

      // show popup
      this.notificationService.show({
        content: "Data refreshed.",
        cssClass: "notification",
        position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
        type: { style: "success", icon: false },  // none, success, error, warning, info
        hideAfter: 2000,  // milliseconds
        animation: {
          type: "fade",
          duration: 150, // milliseconds (notif)
        },
      });

      // hide loading icon
      this.submitLoading = false;
    } catch (error: any) {
      this.submitLoading = false;
      this.logger.error(`${this.logID}getConfig >> error = ${error}`);
      this.notificationService.show({
        content: error.toString(),
        closable: true,
        cssClass: "notification",
        position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
        type: { style: "error", icon: false },  // none, success, error, warning, info
        hideAfter: 10000,  // milliseconds
        animation: {
          type: "fade",
          duration: 150, // milliseconds (notif)
        },
      });
    }
  }

  // OpenVPN Servers Grid
  /* #region */

  public openVPNserversGridAdd({ sender }: any) {
    this.openVPNserversGridClose(sender);

    this.OpenVPNserversGridForm = this.formBuilder.group({
      "guid": [uuidv4()],
      "name": ["", [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      "host": ["", [Validators.required, Validators.pattern(this.ipRegex)]],
      "port": [undefined, [Validators.required, Validators.min(1), Validators.max(65535)]],
      "passwordPrompt": ["", [Validators.minLength(1), Validators.maxLength(255)]],
      "timeout": ["", [Validators.required, Validators.min(1000), Validators.max(999999)]],
    });
    sender.addRow(this.OpenVPNserversGridForm);
  }

  public openVPNserversGridEdit({ sender, rowIndex, dataItem }: any) {
    if (this.debug) {
      this.logger.debug(`${this.logID}openVPNserversGridEdit >> dataItem = ${JSON.stringify(dataItem)}`);
    }
    this.openVPNserversGridClose(sender);

    const data: OpenVPNserversGridIntf = dataItem;

    this.OpenVPNserversGridForm = this.formBuilder.group({
      "guid": [data.guid],
      "name": [data.name, [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      "host": [data.host, [Validators.required, Validators.pattern(this.ipRegex)]],
      "port": [data.port, [Validators.required, Validators.min(1), Validators.max(65535)]],
      "passwordPrompt": [data.passwordPrompt, [Validators.minLength(1), Validators.maxLength(255)]],
      "timeout": [data.timeout, [Validators.required, Validators.min(1000), Validators.max(999999)]],
    });

    this.openVPNserversGridRow = rowIndex;

    sender.editRow(rowIndex, this.OpenVPNserversGridForm);
  }

  public openVPNserversGridCancel({ sender, rowIndex }: any) {
    this.openVPNserversGridClose(sender, rowIndex);
  }

  public openVPNserversGridSave({ sender, rowIndex, formGroup, isNew }: any) {
    if (this.debug) {
      this.logger.debug(`${this.logID}openVPNserversGridSave >> formGroup.value = ${JSON.stringify(formGroup.value)}`);
    }

    // get data
    const data: OpenVPNserversGridIntf = formGroup.value;

    if (isNew) {
      // add record to array
      this.openVPNserversGridData.push(data);
    } else {
      // update specific record in array
      for (const row of this.openVPNserversGridData) {
        if (row.guid === data.guid) {
          row.name = data.name;
          row.host = data.host;
          row.port = data.port;
          row.passwordPrompt = data.passwordPrompt;
          row.timeout = data.timeout;
          break;
        }
      }
    }

    // close editing
    sender.closeRow(rowIndex);
  }

  public openVPNserversGridRemove({ dataItem }: any) {
    if (this.debug) {
      this.logger.debug(`${this.logID}openVPNserversGridRemove >> dataItem = ${JSON.stringify(dataItem)}`);
    }

    // get data
    const data: OpenVPNserversGridIntf = dataItem;

    // filter out removed row
    this.openVPNserversGridData = this.openVPNserversGridData.filter((obj: OpenVPNserversGridIntf) => {
      return obj.guid !== data.guid;
    });
  }

  private openVPNserversGridClose(grid: any, rowIndex = this.openVPNserversGridRow) {
    grid.closeRow(rowIndex);
    this.openVPNserversGridRow = 0;
    this.OpenVPNserversGridForm = undefined!;
  }

  /* #endregion */

}
