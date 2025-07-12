const express = require('express');
const request = require('request');
const { WebSocketServer } = require('ws');
const { json } = require('body-parser');
const fs = require('fs');
const readline = require('readline');



//global variables

let clientseq = 0;
let serverseq = 0;
let streamid = 0;

let tunnel = null;
let conversationid = null;

const server = express();
server.use(express.static('public'));
const httpServer = server.listen(8081, () => {
             Logger("INFO","AudioConnector Server is running on http://localhost:8081");
});
const wss = new WebSocketServer({noServer:true}) ; //new WebSocketServer({port:8082});


httpServer.on('upgrade', (request, socket, head) => {
            console.log(`Received a HTTP upgrade request on ${request.url} from ${request.headers['user-agent']} ${request.headers.origin}`);
           // console.log(request);
            //validate request signature todo

            wss.handleUpgrade(request, socket, head, (ws) => {
                        
                    wss.emit('connection', ws, request);
            });
});





//event handlers
process.stdin.on('keypress',(str,key) => {

    switch(str)
    {
        case 'q':
            
           // tunnel.close();
            wss.close();
            Logger("INFO","AudioConnector Server ended.");
            process.exit();
            break;
        case 'p':
            PauseStream();
            break;
        case 'c':
            ResumePausedStream();
            break;
        case 'd':
            EndBotSession();
            break;
         case 'b':
            BargeInStream();
            break;
        case 'a':
            SendBotTurnEvent("Bot turn response with live agent handoff");
            sendAgentHandover("./audiosources/okok.wav");
            break;
        case '1':
            sendAudio("./audiosources/with_victoria.wav");

            SendBotTurnEvent("Bot turn response with Victoria");
            break;
        case '2':
            sendAudio("./audiosources/heard_not_listen.wav");
            break;
        case '3':
            SendBotTurnEvent("Bot turn response with 60s story");
            sendAudio("./audiosources/60s_story.wav");
            break;

    }
});

wss.on('connection', function connection(ws) {
    Logger("INFO","New Websocket Connection");
    clientseq = 1;

    ws.on('message', (message) => {
        

        let jsonmessage = null;
        try {
            jsonmessage = JSON.parse(message);
            Logger("RECV",JSON.stringify(jsonmessage));
            
            //save current server sequence ID in case we need to send a request
            serverseq = jsonmessage.seq;
            streamid = jsonmessage.id;
        
            if(jsonmessage.type == 'open')
            {
                
                conversationid = jsonmessage.parameters.conversationId;

                var openedresponse = {
                    "version":jsonmessage.version,
                    "type":"opened",
                    "clientseq": serverseq,
                    "seq":clientseq++,
                    "id":streamid,
                    "parameters": {
                        "startPaused":false,
                        "media": [ jsonmessage.parameters.media[0]]
                    }
                }

                ws.send(JSON.stringify(openedresponse));
               
                Logger("XMIT",JSON.stringify(openedresponse));
                 sendAudio("./audiosources/welcome.wav");
                
            }
            else if (jsonmessage.type == 'close')
            {
            
                var closedresponse = {
                        "version": jsonmessage.version,
                        "type": "closed",
                        "seq": clientseq++,
                        "clientseq":serverseq,
                        "id": streamid,
                        "parameters": {
                        }
                }
                ws.send(JSON.stringify(closedresponse));
               
                Logger("XMIT",JSON.stringify(closedresponse));
            }   
            else if (jsonmessage.type == 'ping')
            {

                var pong = {
                    "version": jsonmessage.version,
                    "type": "pong",
                    "clientseq":serverseq,
                    "seq":clientseq++,
                    "id": streamid,
                    "parameters": { }
                }
                ws.send(JSON.stringify(pong));
                Logger("XMIT",JSON.stringify(pong));
            }
            else if (jsonmessage.type == 'playback_completed')
            {

              
            }
            else if (jsonmessage.type == 'playback_started')
            {

            }
            else if (jsonmessage.type == 'resumed')
            {

             
            }
            else if (jsonmessage.type == 'dtmf')
            {

             
            }
        } catch(e) 
        {
           // Logger("RECV","Received audio chunk (message length " + message.length); 
            //mediaStreamSaver.twilioStreamMedia(message);       
        }
    });

    ws.on('close', () => {
        Logger("INFO", "Websocket Disconnection");
      });
});

//functions
function Logger(state, data){
    console.log(new Date().toISOString() + " - " + state + " -- " + data );
}

function EndBotSession(){

    var bye = {
        "version": "2",
        "type": "disconnect",
        "clientseq":serverseq,
        "seq":clientseq++,
        "id": streamid,
        "parameters": {
            "reason": "completed",
            "outputVariables": {
                "bot_exit": "success", 
                "bot_purpose": "test",
                "bot_live_agent_handoff": "false"
            }
        }
        }
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify(bye));
     });

    Logger("XMIT",JSON.stringify(bye));
}

function PauseStream(){

    var message = {
        "version": "2",
        "type": "pause",
        "clientseq":serverseq,
            "seq":clientseq++,
            "id": streamid,
        "parameters": {
        }
    }
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify(message));
     });

    Logger("XMIT",JSON.stringify(message));
}

function BargeInStream(){

    var bargeInMessage = {
            "version": "2",
            "type": "event",
            "clientseq":serverseq,
            "seq":clientseq++,
            "id": streamid,
           "parameters": {
                "entities": [
                {
                    "type": "barge_in",
                    "data": {
                    }
                }
                ]
            }
    }

     wss.clients.forEach(function each(client) {
        client.send(JSON.stringify(bargeInMessage));
     });

    Logger("XMIT",JSON.stringify(bargeInMessage));

}

function SendBotTurnEvent(intent){

        var botTurnEvent =
        {
        "version": "2",
        "type": "event",
        "clientseq":serverseq,
        "seq":clientseq++,
        "id": streamid,
        "parameters": {
            "entities": [
            {
                "type": "bot_turn_response",
                "data": {
                    "disposition": "match",
                    "text": intent,
                    "confidence": 0.5
                }
            }
            ]
        }
        }

        wss.clients.forEach(function each(client) {
            client.send(JSON.stringify(botTurnEvent));
         });
        Logger("XMIT",JSON.stringify(botTurnEvent));
}

function sendAudio(audiopromptfile){

            const audioBuffer = fs.readFileSync(audiopromptfile); 
            console.log(`Audio file size: ${audioBuffer.length} bytes`);
               
            const chunkSize = 64000; // 1KB chunks
            let offset = 0;
            
            const sendChunk = () => {
            if (offset < audioBuffer.length) {
                const chunk = audioBuffer.slice(offset, offset + chunkSize);
                wss.clients.forEach(function each(client) {
                 client.send(chunk);
              });
                offset += chunkSize;
                
                // Send next chunk after small delay
                setTimeout(sendChunk, 10);
            } else {
                console.log('All chunks sent');
               
            }
            };
            
            sendChunk();
}

function sendAgentHandover(audiopromptfile){

            const audioBuffer = fs.readFileSync(audiopromptfile); 
            console.log(`Audio file size: ${audioBuffer.length} bytes`);
               
            const chunkSize = 64000; // 1KB chunks
            let offset = 0;
            
            const sendChunk = () => {
            if (offset < audioBuffer.length) {
                const chunk = audioBuffer.slice(offset, offset + chunkSize);
                wss.clients.forEach(function each(client) {
                 client.send(chunk);
              });
                offset += chunkSize;
                
                // Send next chunk after small delay
                setTimeout(sendChunk, 10);
            } else {
                console.log('All chunks sent');

                var hand_over_message = {
                "version": "2",
                "type": "disconnect",
                "clientseq":serverseq,
                "seq":clientseq++,
                "id": streamid,
                "parameters": {
                    "reason": "completed",
                    "outputVariables": {
                        "bot_exit": "success", 
                        "bot_purpose": "test",
                        "bot_live_agent_handoff": "true"
                    }
                }
                }
                wss.clients.forEach(function each(client) {
                    client.send(JSON.stringify(hand_over_message));
                });

                Logger("XMIT",JSON.stringify(hand_over_message));

               
            }
            };
            
            sendChunk();
}

function ResumePausedStream(){

    var resumemessage = {
        "version": "2",
        "type": "resume",
        "clientseq":serverseq,
            "seq":clientseq++,
            "id": streamid,
        "parameters": {
        }
    }
    wss.clients.forEach(function each(client) {
        client.send(JSON.stringify(resumemessage));
     });

    Logger("XMIT",JSON.stringify(resumemessage));
}

function main()
{
    console.log("");
    console.log("App control: Press key:");
    console.log("  1 or 2 to play short audio prompts");
    console.log("  3 for 60 s audio prompt");
    console.log("  p to pause incoming stream");
    console.log("  c to continue paused stream");
    console.log("  b for barge-in");
    console.log("  a for hand off to live agent");
    console.log("  d to end bot session");
    console.log("  q to exit program");
    console.log("");
    process.stdin.setRawMode(true);
    readline.emitKeypressEvents(process.stdin);

   

}

//init
main();

