import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";

// services
import { NotificationService } from "@progress/kendo-angular-notification";
import { AuthService, ServerService } from "../server.service";

// progress
import { GridDataResult } from "@progress/kendo-angular-grid";
import { SortDescriptor, orderBy } from "@progress/kendo-data-query";

// interfaces
import { ClientsIntf } from "../interfaces/ClientsIntf";
import { OpenVPNserversIntf } from "../interfaces/OpenVPNserversIntf";

// Icons
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';

// Other
import { NGXLogger } from 'ngx-logger';
import config from "../../assets/config.json";

@Component({
  selector: 'app-server',
  templateUrl: './server.component.html',
  styleUrls: ['./server.component.scss']
})
export class ServerComponent implements OnInit {
  private debug: boolean = config.debug;
  private logID: string = "ServerComponent.";
  private serverID: number | undefined = undefined;
  public clientsLoading: boolean = false;
  public openvpnServer: OpenVPNserversIntf | undefined = undefined;
  // clients grid
  public clientsGridSort: SortDescriptor[] = [
    {
      field: "name",
      dir: "asc"
    }
  ];
  clientsGridData: Array<ClientsIntf> = [];
  clientsGridRow: number = 0;
  // icons
  faPencilAlt = faPencilAlt;
  faCircleQuestion = faCircleQuestion;

  constructor(
    private authService: AuthService,
    private serverService: ServerService,
    private notificationService: NotificationService,
    private logger: NGXLogger,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    // get server ID from route
    this.serverID = Number(this.route.snapshot.params.id);
    if (this.debug) {
      this.logger.debug(`${this.logID}constructor >> serverID = ${this.serverID}`);
    }

    if (this.serverID == null) {
      // show popup
      this.notificationService.show({
        content: "ID not found.",
        cssClass: "notification",
        position: { horizontal: "center", vertical: "top" },  // left/center/right, top/bottom
        type: { style: "warning", icon: false },  // none, success, error, warning, info
        hideAfter: 2000,  // milliseconds
        animation: {
          type: "fade",
          duration: 150, // milliseconds (notif)
        },
      });

      // navigate
      this.router.navigate(["home"]);
    }


  }

  async ngOnInit() {
    try {
      // set active class in navbar
      setTimeout(() => {
        this.authService.serverSelectedEvent.emit();
      });

      if (this.serverID != undefined) {
        // get OpenVPN server from ID
        await this.getOpenvpnServer(this.serverID);
      }
    } catch (error: any) {
      this.clientsLoading = false;
      this.logger.error(`${this.logID}ngOnInit >> error = ${error}`);
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

  async getOpenvpnServer(id: number) {
    try {
      // show loading icon
      this.clientsLoading = true;

      // get servers from YAML config file
      const openvpnServers: Array<OpenVPNserversIntf> = await this.serverService.getConfig();
      if (this.debug) {
        this.logger.debug(`${this.logID}getOpenvpnServer >> openvpnServers = ${JSON.stringify(openvpnServers)}`);
      }

      // get server by ID
      this.openvpnServer = openvpnServers.find(openvpnServer => openvpnServer.id === id);
      if (this.debug) {
        this.logger.debug(`${this.logID}getOpenvpnServer >> openvpnServer = ${JSON.stringify(this.openvpnServer)}`);
      }

      // hide loading icon
      this.clientsLoading = false;
    } catch (error: any) {
      this.clientsLoading = false;
      this.logger.error(`${this.logID}getOpenvpnServer >> error = ${error}`);
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

  public disconnectClient({ dataItem }: any) {
    if (this.debug) {
      this.logger.debug(`${this.logID}disconnectClient >> dataItem = ${JSON.stringify(dataItem)}`);
    }

    // get data
    const data: ClientsIntf = dataItem;
  }
}
