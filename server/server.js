import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the dist directory
app.use(express.static('dist'));

// Store active connections
const activeConnections = new Map();

// Function to list available serial ports
async function listSerialPorts() {
  try {
    const ports = await SerialPort.list();
    return ports.map(port => ({
      path: port.path,
      manufacturer: port.manufacturer
    }));
  } catch (err) {
    console.error('Error listing serial ports:', err);
    return [];
  }
}

// Function to create Arduino connection
function connectArduino(portPath) {
  const port = new SerialPort({
    path: portPath,
    baudRate: 9600
  });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  return { port, parser };
}

// Function to create Raspberry Pi connection (via SSH or direct serial)
function connectRaspberryPi(host) {
  // Implementation would depend on your specific Raspberry Pi setup
  // This is a placeholder that simulates data
  return {
    getData: () => Math.random() * 100
  };
}

// Function to generate localhost data
function generateLocalhostData() {
  const timestamp = Date.now();
  return Math.sin(timestamp / 1000) * 50 + 50;
}

io.on('connection', async (socket) => {
  console.log('Client connected');
  
  // Send available serial ports to client
  const ports = await listSerialPorts();
  socket.emit('ports', ports);

  let dataInterval;

  socket.on('start', async ({ portType, portPath }) => {
    // Clear any existing interval
    if (dataInterval) {
      clearInterval(dataInterval);
    }

    try {
      switch (portType) {
        case 'arduino':
          if (activeConnections.has(portPath)) {
            // Reuse existing connection
            const { parser } = activeConnections.get(portPath);
            parser.on('data', (data) => {
              socket.emit('data', parseFloat(data));
            });
          } else {
            // Create new connection
            const connection = connectArduino(portPath);
            activeConnections.set(portPath, connection);
            connection.parser.on('data', (data) => {
              socket.emit('data', parseFloat(data));
            });
          }
          break;

        case 'raspberry':
          const rpi = connectRaspberryPi(portPath);
          dataInterval = setInterval(() => {
            socket.emit('data', rpi.getData());
          }, 1000);
          break;

        case 'localhost':
        default:
          dataInterval = setInterval(() => {
            socket.emit('data', generateLocalhostData());
          }, 1000);
          break;
      }
    } catch (err) {
      console.error('Error starting data collection:', err);
      socket.emit('error', { message: 'Failed to start data collection' });
    }
  });

  socket.on('stop', ({ portType, portPath }) => {
    if (dataInterval) {
      clearInterval(dataInterval);
    }

    if (portType === 'arduino' && activeConnections.has(portPath)) {
      const connection = activeConnections.get(portPath);
      connection.parser.removeAllListeners('data');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (dataInterval) {
      clearInterval(dataInterval);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});