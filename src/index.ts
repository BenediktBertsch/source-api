import { createSocket, RemoteInfo } from "dgram";
import { Application } from "express";
import { ISocketData } from "./models/socket-data.model";
import { IServerInfo } from "./models/server-info.model";

var express = require('express');
var app: Application = express();
var port;
if (process.env.port == null) {
    port = 5000;
} else {
    port = parseInt(process.env.port, 10)
}

app.get("/:ip/:port", function (req, res) {
    sendData(Buffer.from(A2S_INFO), req.params.ip, parseInt(req.params.port)).then(e => {
        var info = parseInfoBuffer(e.buffer);
        res.send(`{
            "server_status": "1",
            "server_name": "${info.serverName}",
            "server_game": "${info.game}",
            "server_playercount": "${info.playerCount}/${info.maxPlayerCount}",
            "server_bots": "${info.botCount}"
            }`);

    }).catch((e) => {
        res.status(500).send();
    });
})
app.get("/prometheus/:ip/:port", function (req, res) {
    sendData(Buffer.from(A2S_INFO), req.params.ip, parseInt(req.params.port)).then(e => {
        var info = parseInfoBuffer(e.buffer);
        var servername = info.serverName.replace(/ /g, "_");
        var notallowedarray = ['[', ']', '{', '}', '.', ',']
        notallowedarray.forEach((notallowed) => {
            servername = servername.replace(notallowed, '')
        })
        servername = servername.toLowerCase()
        res.write(`src_${servername}_status 1
src_${servername}_players ${info.playerCount}
src_${servername}_botcount ${info.botCount}
`);
        res.end(``);
    }).catch((e) => {
        res.status(500).send();
    });
})
app.listen(port)

var BASE = [0xFF, 0xFF, 0xFF, 0xFF];
var A2S_INFO = [0xFF, 0xFF, 0xFF, 0xFF, 0x54, 0x53, 0x6F, 0x75, 0x72, 0x63, 0x65, 0x20, 0x45, 0x6E, 0x67, 0x69, 0x6E, 0x65, 0x20, 0x51, 0x75, 0x65, 0x72, 0x79, 0x00];
var A2S_PLAYER = [0xFF, 0xFF, 0xFF, 0xFF, 0x55, 0xFF, 0xFF, 0xFF, 0xFF];

function getSubStr(msg: Buffer) {
    var ret = '';
    for (var i = 0; i < msg.length; i++) {
        if (msg[i] == 0) { break; }
        var c = String.fromCharCode(msg[i]);
        ret += c;
    } return { value: ret, count: i };
}

function sendData(data: Buffer, ip: string, port: number): Promise<ISocketData> {
    var socket = createSocket('udp4');

    socket.send(data, port, ip, (err) => {
        if (err) {
            socket.close();
            console.log(err)
        }else{
            console.log('Data successfully sent.')
        }
    });

    return new Promise((resolve, reject) => {
        var wait = setTimeout(() => {
            reject();
        }, 300);

        socket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
            clearTimeout(wait);
            resolve({
                buffer: msg,
                remoteInfo: rinfo
            });
        });
        socket.on('error', (err) => {
            console.log(err)
            console.log('Closing socket...')
            socket.close();
        })
    });
}

function parseInfoBuffer(msg: Buffer): IServerInfo {
    var msgContent = msg.slice(6, msg.length - 1);
    var serverName = '';
    var map = '';
    var folder = '';
    var game = '';
    var playerCount = 0;
    var maxPlayerCount = 0;
    var botCount = 0;
    // Server Name:    
    var ret = getSubStr(msgContent);
    serverName = ret.value;
    msgContent = msgContent.slice(ret.count + 1, msgContent.length - 1);
    // Map Name:    
    var ret = getSubStr(msgContent);
    map = ret.value;
    msgContent = msgContent.slice(ret.count + 1, msgContent.length - 1);
    // Folder Name:    
    var ret = getSubStr(msgContent);
    folder = ret.value;
    msgContent = msgContent.slice(ret.count + 1, msgContent.length - 1);
    // Game Name:    
    var ret = getSubStr(msgContent);
    game = ret.value;
    msgContent = msgContent.slice(ret.count + 1, msgContent.length - 1);
    // Remove 16Bit SteamApplicationId:    
    msgContent = msgContent.slice(2, msgContent.length - 1);
    playerCount = msgContent[0];
    maxPlayerCount = msgContent[1];
    botCount = msgContent[2];
    msgContent = msgContent.slice(6, msgContent.length - 1);

    return {
        serverName,
        game,
        playerCount,
        botCount,
        maxPlayerCount,
        map
    }
}