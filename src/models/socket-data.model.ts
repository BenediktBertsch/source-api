import { RemoteInfo } from "dgram";

export interface ISocketData {
    buffer: Buffer;
    remoteInfo: RemoteInfo;
}