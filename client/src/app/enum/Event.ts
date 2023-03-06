export enum Event {
    // socket
    SOCKET_SHUTDOWN = "socket_shutdown",
    SOCKET_ERROR = "socket_error",
    SOCKET_CLOSE = "socket_close",
    SOCKET_TIMEOUT = "socket_timeout",
    // OpenVPN responses
    BYTECOUNT_CLI = "bytecount_cli",
    CLIENT_LIST = "client_list",
    ROUTING_TABLE = "routing_table",
    SERVER_TIME = "server_time",
};