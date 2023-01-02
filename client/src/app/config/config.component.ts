


import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

// services
import { NotificationService } from "@progress/kendo-angular-notification";
import { AuthService, ServerService } from "../server.service";

// progress
import { SortDescriptor } from "@progress/kendo-data-query";

// interfaces
import { OpenVPNserversIntf } from "../interfaces/OpenVPNserversIntf";
import { OpenVPNserversGridIntf } from "../interfaces/OpenVPNserversGridIntf";

// Icons
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';

// Other
import { NGXLogger } from 'ngx-logger';
import config from "../../assets/config.json";
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: "app-config",
  templateUrl: "./config.component.html",
  styleUrls: ["./config.component.scss"],
})
export class ConfigComponent implements OnInit {
  private debug: boolean = config.debug;
  private logID: string = "ConfigComponent.";
  public configLoading: boolean = false;
  public submitLoading: boolean = false;
  private ipRegex: RegExp = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  // openvpn servers grid
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
    // get eBox network
    this.getConfig();
  }

  ngOnInit() {
    // set active class in navbar
    setTimeout(() => {
      this.authService.configSelectedEvent.emit();
    });
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
          "id": openVPNserver.id,
          "name": openVPNserver.name,
          "host": openVPNserver.host,
          "port": openVPNserver.port,
          "password": openVPNserver.password,
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

      // create submit data
      const openVPNservers: Array<OpenVPNserversIntf> = [];
      for (const openVPNserver of this.openVPNserversGridData) {
        openVPNservers.push({
          "id": openVPNserver.id,
          "name": openVPNserver.name,
          "host": openVPNserver.host,
          "port": openVPNserver.port,
          "password": openVPNserver.password,
          "timeout": openVPNserver.timeout,
        })
      }

      // check if all server ID's are unique
      const uniqueOpenVPNservers = new Set(openVPNservers.map(openVPNserver => openVPNserver.id));
      if (uniqueOpenVPNservers.size < openVPNservers.length) {
        this.logger.error(`${this.logID}submitConfig >> duplicates found >> uniqueOpenVPNservers.size = ${uniqueOpenVPNservers.size}; openVPNservers.length = ${openVPNservers.length}`);

        // show popup
        this.notificationService.show({
          content: "ID must be unique.",
          cssClass: "notification",
          position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
          type: { style: "warning", icon: false },  // none, success, error, warning, info
          hideAfter: 2000,  // milliseconds
          animation: {
            type: "fade",
            duration: 150, // milliseconds (notif)
          },
        });

        // hide loading icon
        this.submitLoading = false;

        return;
      }

      // check if ID starts at 0 and is sequential
      for (let index = 0; index < openVPNservers.length; index++) {
        const openVPNserver = openVPNservers[index];
        if (openVPNserver.id != index) {
          // show popup
          this.notificationService.show({
            content: "ID must start at 0 and continue sequentially (e.g. 0,1,2,3...).",
            cssClass: "notification",
            position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
            type: { style: "warning", icon: false },  // none, success, error, warning, info
            hideAfter: 3000,  // milliseconds
            animation: {
              type: "fade",
              duration: 150, // milliseconds (notif)
            },
          });

          // hide loading icon
          this.submitLoading = false;

          return;
        }
      }

      // submit data
      await this.serverService.updateConfig(openVPNservers);

      // show popup
      this.notificationService.show({
        content: "Config updated.",
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
        hideAfter: 5000,  // milliseconds
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
      "id": [undefined, [Validators.required, Validators.min(0), Validators.max(99999)]],
      "name": ["", [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      "host": ["", [Validators.required, Validators.pattern(this.ipRegex)]],
      "port": [undefined, [Validators.required, Validators.min(1), Validators.max(65535)]],
      "password": ["", [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
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
      "id": [data.id, [Validators.required, Validators.min(0), Validators.max(99999)]],
      "name": [data.name, [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      "host": [data.host, [Validators.required, Validators.pattern(this.ipRegex)]],
      "port": [data.port, [Validators.required, Validators.min(1), Validators.max(65535)]],
      "password": [data.password, [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
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
          row.id = data.id;
          row.name = data.name;
          row.host = data.host;
          row.port = data.port;
          row.password = data.password;
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
