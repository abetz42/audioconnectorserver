# AudioConnectorServer

Basic audioconnector server implementation for single call handling to demo protocol
https://developer.genesys.cloud/devapps/audiohook/features#audio-connector

### Installation

- Install Node js
- Download project
- npm install


### Usage

- Follow https://help.mypurecloud.com/articles/about-audio-connector/ to install and configure your Audiohook client integration
- Set Audiohook Connection URL to your server websocket address
- open cmd prompt in project directory
- enter: node index.js
- use keyboard input to issue commands
    -  press key 1 or 2 to play short audio prompts to caller
    -  press key 3 to play 60 s audio prompt to caller
    -  press key p to pause incoming audio stream
    -  press key c to continue paused stream
    -  press key b for barge-in
    -  press key a for hand off to live agent
    -  press key d to end bot session
    -  press key q to exit audioconnectorserver


### Summary
Web Server & WebSocket:
The program starts an Express web server on port 8081 and sets up a WebSocket server for real-time, bidirectional communication with clients.

Audio Streaming:
It receives binary audio data from WebSocket clients, writes the audio chunks to a WAV file using a custom AudioStreamWriter, and can send audio files back to clients in chunks.

Bot Session Management:
The server handles various bot session events (open, close, ping, dtmf, etc.) by sending and receiving structured JSON messages. It can pause, resume, end, or hand off the session to a live agent.

Keyboard Controls:
The server process listens for keypresses on the terminal to trigger actions like sending audio prompts, pausing/resuming streams, ending sessions, barge-in, and agent handoff.

Logging:
All significant events and messages are logged with timestamps for monitoring and debugging.