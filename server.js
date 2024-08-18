const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080; // Use the PORT environment variable or default to 8080

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on('connection', (ws) => {
    console.log('New client connected');
    broadcastUserCount();

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        const channel = data.channel;

        if (!clients.has(channel)) {
            clients.set(channel, new Set());
        }
        clients.get(channel).add(ws);

        // Broadcast the message to all clients in the same channel
        clients.get(channel).forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        // Remove the client from all channels
        clients.forEach((channelClients, channel) => {
            channelClients.delete(ws);
            if (channelClients.size === 0) {
                clients.delete(channel);
            }
        });
        broadcastUserCount();
    });
});

function broadcastUserCount() {
    const userCount = Array.from(clients.values()).reduce((acc, set) => acc + set.size, 0);
    const message = JSON.stringify({ type: 'userCount', count: userCount });
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

server.listen(PORT, () => {
    console.log(`WebSocket server is running on port ${PORT}`);
});