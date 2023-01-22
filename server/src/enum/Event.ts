export enum Event {
    // socket
    SOCKET_SHUTDOWN = "socket_shutdown",
    SOCKET_ERROR = "socket_error",
    SOCKET_CLOSE = "socket_close",
    SOCKET_TIMEOUT = "socket_timeout",
    // OpenVPN command responses
    BYTECOUNT_CLI = "bytecount_cli",
};