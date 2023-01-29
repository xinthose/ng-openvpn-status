export interface WSstatusIntf {
	"CommonName": string,
	"RealAddress": string,
	"VirtualAddress": string,
	"VirtualIPv6Address": string,
	"BytesReceived": number,
	"BytesSent": number,
	"ConnectedSince": Date,
	"ConnectedSinceEpoch": number,
	"Username": string,
	"ClientID": number,
	"PeerID": number,
	"DataChannelCipher": string,
};