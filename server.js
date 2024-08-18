const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;
const HEARTBEAT_INTERVAL = 3000; // 3 seconds
const CLIENT_TIMEOUT = 6000; // 6 seconds

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Set();

function noop() {}

function heartbeat() {
    this.isAlive = true;
}

wss.on('connection', (ws) => {
    clients.add(ws);
    ws.isAlive = true;
    console.log('New client connected');
    broadcastUserCount();

    ws.on('pong', heartbeat);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            // Broadcast the message to all clients
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
        broadcastUserCount();
    });
});

function broadcastUserCount() {
    const userCount = clients.size;
    const message = JSON.stringify({ type: 'userCount', count: userCount });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            clients.delete(ws);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping(noop);
    });
    broadcastUserCount();
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
    clearInterval(interval);
});

server.listen(PORT, () => {
    console.log(`WebSocket server is running on port ${PORT}`);
});