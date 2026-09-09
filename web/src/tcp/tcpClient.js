// TCP client helper: reads line-based responses from the Ex2 C++ server
// according to our text protocol and returns parsed data to the service/controller.

// Import Node's built-in TCP module
const net = require('net');

// LineReader accumulates incoming TCP data and allows reading it line-by-line ("\n" terminated).
class LineReader {
    constructor(socket) {
        this.socket = socket;
        this.buffer = '';   // Holds received data that may not yet contain a full line
        this.pending = [];  // Queue of pending readLine() requests: { resolve, reject }

        // When new data arrives, append it to the buffer and try to fulfill pending reads
        socket.on('data', (chunk) => {
            this.buffer += chunk.toString('utf8');
            this._drain(); // Try to extract complete lines from the buffer
        });

        // If a socket error occurs, reject all pending readLine promises
        socket.on('error', (err) => {
            while (this.pending.length) this.pending.shift().reject(err);
        });

        // If the socket closes, reject all pending reads (no more data will arrive)
        socket.on('close', () => {
            while (this.pending.length) this.pending.shift().reject(new Error('Socket closed'));
        });
    }

    // Drain the buffer: while there are pending readLine() calls,
    // try to find a newline '\n'. If found, resolve one pending promise with one line.
    _drain() {
        while (this.pending.length) {
            const idx = this.buffer.indexOf('\n');
            if (idx === -1) return; // No full line yet

            // Extract one line (without '\n') and remove it from the buffer
            let line = this.buffer.slice(0, idx);
            this.buffer = this.buffer.slice(idx + 1);

            // Normalize CRLF: remove trailing '\r' if present
            if (line.endsWith('\r')) {
                line = line.slice(0, -1);
            }

            const { resolve } = this.pending.shift();
            resolve(line);
        }
    }

    // Returns a Promise that resolves with the next line received from the socket (without '\n').
    readLine() {
        return new Promise((resolve, reject) => {
            this.pending.push({ resolve, reject });
            this._drain(); // In case a full line is already in the buffer
        });
    }
}


// TCP client used by the Node.js web server to communicate
// with the Exercise 2 C++ server using a text-based protocol.
class TcpClient {
    constructor(host, port) {
        this.host = host;
        this.port = port;
        this.socket = null;
        this.reader = null;
    }

    // opens a TCP connection to the ex2 server, returns a promise that resolved when 
    // the ccnnection is established
    connect() {
        return new Promise((resolve, reject) => {
            this.socket = net.createConnection({ host: this.host, port: this.port }, () => {
                this.reader = new LineReader(this.socket); // once connected initialize LineReader
                resolve();
            });
        this.socket.on('error', reject);
        });
    }

    // closes the TCP connection and releases all related resources.
    close() {
        if (this.socket) {
            this.socket.end();
            this.socket.destroy(); // forced close 
            this.socket = null;
            this.reader = null;
        }
    }

    // sends a single command line to the ex2 server and reads the response
    async sendCommand(line) {
        if (!this.socket || !this.reader) {
            throw new Error('Not connected');
        }

    // Ensure command ends with '\n'
    const payload = line.endsWith('\n') ? line : (line + '\n');
    this.socket.write(payload);

    // Read status line
    const statusLine = await this.reader.readLine();
    const statusCode = parseInt(statusLine.split(' ')[0], 10);

    // If 200, read separator empty line + body until empty line
    let bodyLines = [];
    if (statusLine.startsWith('200 ')) {
        const sep = await this.reader.readLine(); // should be empty
        // (We don't strictly validate sep here - skeleton)
        while (true) {
            const l = await this.reader.readLine();
            if (l === '') break;
            bodyLines.push(l);
        }
    }

    return { statusLine, statusCode, bodyLines };
    }
}

// creates a TcpClient using environment variables (configuration is on DockerCompose)
function createTcpClientFromEnv() {
    const host = process.env.EX2_HOST || 'localhost';
    const port = parseInt(process.env.EX2_PORT || '5555', 10);
    return new TcpClient(host, port);
}

module.exports = {
    TcpClient,
    createTcpClientFromEnv,
};