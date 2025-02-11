import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, 'generated_data');

try {
  await fs.mkdir(dataDir, { recursive: true });
} catch (err) {
  console.error('Error Creating Data Directory:', err);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('dist'));
app.use('/data', express.static('data'));

const activeConnections = new Map();
const sessionData = new Map();

function parseArduinoData(data) {
  try {
    // Parse the comma-separated values from Arduino
    const values = data.trim().split(',');
    const result = {};
    
    values.forEach(item => {
      const [key, value] = item.split(':').map(s => s.trim());
      result[key] = parseFloat(value);
    });

    return {
      'streamline-1': result['Y1'] || 0,
      'streamline-2': result['Y2'] || 0,
      'streamline-3': result['Y3'] || 0,
      'streamline-4': result['Y4'] || 0
    };
  } catch (err) {
    console.error('Error parsing Arduino data:', err);
    return null;
  }
}

async function connectArduino(portPath) {
  console.log(`Attempting to connect to Arduino on ${portPath}`);
  
  const port = new SerialPort({
    path: portPath,
    baudRate: 19200 // Match Arduino baud rate
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  port.on('open', () => {
    console.log(`Successfully opened port ${portPath}`);
  });

  port.on('error', (err) => {
    console.error(`Serial port error on ${portPath}:`, err);
    io.emit('portError', { port: portPath, error: err.message });
  });

  port.on('close', () => {
    console.log(`Port closed: ${portPath}`);
    io.emit('portDisconnected', { port: portPath });
    activeConnections.delete(portPath);
  });

  return { port, parser };
}

io.on('connection', async (socket) => {
  console.log('Client connected:', socket.id);
  const sessionId = socket.id;
  sessionData.set(sessionId, {
    startTime: Date.now(),
    data: []
  });

  socket.on('start', async ({ portPath }) => {
    console.log(`Starting connection to ${portPath}`);
    
    try {
      let connection;
      if (!activeConnections.has(portPath)) {
        connection = connectArduino(portPath);
        activeConnections.set(portPath, connection);
        console.log(`New connection established to ${portPath}`);
      } else {
        connection = activeConnections.get(portPath);
        console.log(`Using existing connection to ${portPath}`);
      }

      const session = sessionData.get(sessionId);
      session.startTime = Date.now();

      connection.parser.on('data', (data) => {
        try {
          const parsedData = parseArduinoData(data);
          if (parsedData) {
            const currentTime = Date.now();
            const seconds = (currentTime - session.startTime) / 1000;
            
            const dataPoint = {
              timestamp: currentTime,
              seconds: Math.round(seconds * 100) / 100, // Round to 2 decimal places
              ...parsedData
            };

            session.data.push(dataPoint);
            socket.emit('data', dataPoint);
          }
        } catch (err) {
          console.error('Error processing Arduino data:', err);
        }
      });

      socket.emit('status', { connected: true, port: portPath });
    } catch (err) {
      console.error('Error starting data collection:', err);
      socket.emit('error', { message: 'Failed to start data collection: ' + err.message });
    }
  });

  socket.on('stop', async ({ portPath }) => {
    console.log(`Stopping connection to ${portPath}`);
    
    if (activeConnections.has(portPath)) {
      const connection = activeConnections.get(portPath);
      connection.parser.removeAllListeners('data');
      connection.port.close((err) => {
        if (err) {
          console.error('Error closing port:', err);
        }
      });
      activeConnections.delete(portPath);
    }

    socket.emit('status', { connected: false, port: portPath });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    for (const [portPath, connection] of activeConnections.entries()) {
      connection.parser.removeAllListeners('data');
      connection.port.close((err) => {
        if (err) {
          console.error('Error closing port on disconnect:', err);
        }
      });
      activeConnections.delete(portPath);
    }

    sessionData.delete(sessionId);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});