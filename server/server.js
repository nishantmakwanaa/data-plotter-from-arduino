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
const dataDir = join(__dirname, 'data');

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
const portStatusCache = new Map();
const virtualIntervals = new Map();

// Simulated vital signs generator
function generateVirtualData() {
  const baseHeartRate = 75;
  const baseOxygenSat = 98;
  const time = Date.now() / 1000;
  const heartRateVariation = Math.sin(time) * 5 + Math.random() * 2;
  const oxygenSatVariation = Math.sin(time * 0.5) * 1 + Math.random() * 0.5;

  return {
    heartRate: baseHeartRate + heartRateVariation,
    oxygenSat: Math.min(100, baseOxygenSat + oxygenSatVariation)
  };
}

async function saveDataToCSV(sessionId, data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `medical_data_${sessionId}_${timestamp}.csv`;
  const filepath = join(dataDir, filename);
  
  const csvContent = [
    'Timestamp,Heart Rate,Oxygen Saturation,Relation',
    ...data.map(d => `${d.timestamp},${d.original},${d.processed},${d.relation}`)
  ].join('\n');

  try {
    await fs.writeFile(filepath, csvContent);
    console.log(`Data Saved To ${filepath}`);
    return filename;
  } catch (err) {
    console.error('Error Saving CSV:', err);
    throw err;
  }
}

async function checkPortStatus(portPath) {
  if (portPath === 'virtual') return 'online';

  // For active connections, always return online
  if (activeConnections.has(portPath)) {
    return 'online';
  }

  try {
    const port = new SerialPort({
      path: portPath,
      baudRate: 9600,
      autoOpen: false
    });
    
    return new Promise((resolve) => {
      port.open((err) => {
        if (err) {
          console.log(`Port ${portPath} check failed:`, err.message);
          resolve('offline');
          return;
        }
        
        // If we can open the port, it's available
        resolve('online');
        port.close((err) => {
          if (err) console.error(`Error closing port ${portPath}:`, err);
        });
      });
    });
  } catch (err) {
    console.error(`Error checking port ${portPath}:`, err);
    return 'offline';
  }
}

async function listSerialPorts() {
  try {
    const ports = await SerialPort.list();
    const portsWithStatus = await Promise.all(ports.map(async (port) => {
      const status = await checkPortStatus(port.path);
      return {
        id: port.path,
        name: port.friendlyName || port.path,
        type: port.manufacturer?.includes('Arduino') ? 'Arduino' : 'Unknown',
        status: status,
        baudRate: 9600
      };
    }));

    // Add virtual port
    const virtualPort = {
      id: 'virtual',
      name: 'Virtual Medical Monitor',
      type: 'Virtual',
      status: 'online',
      baudRate: 9600
    };

    return [virtualPort, ...portsWithStatus];
  } catch (err) {
    console.error('Error Listing Serial Ports:', err);
    return [{
      id: 'virtual',
      name: 'Virtual Medical Monitor',
      type: 'Virtual',
      status: 'online',
      baudRate: 9600
    }];
  }
}

let lastPortList = [];

async function updatePorts() {
  try {
    const ports = await listSerialPorts();
    const currentPorts = JSON.stringify(ports);

    if (currentPorts !== JSON.stringify(lastPortList)) {
      lastPortList = ports;
      io.emit('ports', ports);
    }
  } catch (err) {
    console.error('Error Updating Serial Ports:', err);
  }
}

// Update ports more frequently
setInterval(updatePorts, 1000);

function connectArduino(portPath) {
  console.log(`Attempting to connect to Arduino on ${portPath}`);
  
  const port = new SerialPort({
    path: portPath,
    baudRate: 9600
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  port.on('open', () => {
    console.log(`Successfully opened port ${portPath}`);
  });

  port.on('error', (err) => {
    console.error(`Serial Port Error on ${portPath}:`, err);
    io.emit('portError', { port: portPath, error: err.message });
  });

  port.on('close', () => {
    console.log(`Port Closed: ${portPath}`);
    io.emit('portDisconnected', { port: portPath });
    activeConnections.delete(portPath);
  });

  return { port, parser };
}

io.on('connection', async (socket) => {
  console.log('Client Connected:', socket.id);
  const sessionId = socket.id;
  sessionData.set(sessionId, []);
  
  const ports = await listSerialPorts();
  socket.emit('ports', ports);

  socket.on('start', async ({ portPath, baudRate = 9600 }) => {
    console.log(`Starting connection to ${portPath} with baudRate ${baudRate}`);
    
    try {
      if (portPath === 'virtual') {
        const interval = setInterval(() => {
          const { heartRate, oxygenSat } = generateVirtualData();
          const timestamp = Date.now();
          const relationValue = (heartRate + oxygenSat) / 2;

          const dataPoint = {
            timestamp,
            original: heartRate,
            processed: oxygenSat,
            relation: relationValue
          };

          const sessionDataArray = sessionData.get(sessionId);
          if (sessionDataArray) {
            sessionDataArray.push(dataPoint);
            socket.emit('data', dataPoint);
          }
        }, 1000);

        virtualIntervals.set(sessionId, interval);
        socket.emit('status', { connected: true, port: portPath });
        return;
      }

      let connection;
      if (!activeConnections.has(portPath)) {
        connection = connectArduino(portPath);
        activeConnections.set(portPath, connection);
        console.log(`New connection established to ${portPath}`);
      } else {
        connection = activeConnections.get(portPath);
        console.log(`Using existing connection to ${portPath}`);
      }

      connection.parser.on('data', (data) => {
        try {
          const [heartRate, oxygenSat] = data.trim().split(',').map(Number);
          if (!isNaN(heartRate) && !isNaN(oxygenSat)) {
            const timestamp = Date.now();
            const relationValue = (heartRate + oxygenSat) / 2;

            const dataPoint = {
              timestamp,
              original: heartRate,
              processed: oxygenSat,
              relation: relationValue
            };

            const sessionDataArray = sessionData.get(sessionId);
            if (sessionDataArray) {
              sessionDataArray.push(dataPoint);
              socket.emit('data', dataPoint);
            }
          }
        } catch (err) {
          console.error('Error Parsing Arduino Data:', err);
        }
      });

      socket.emit('status', { connected: true, port: portPath });
    } catch (err) {
      console.error('Error Starting Data Collection:', err);
      socket.emit('error', { message: 'Failed to start data collection: ' + err.message });
    }
  });

  socket.on('stop', async ({ portPath }) => {
    console.log(`Stopping connection to ${portPath}`);
    
    if (portPath === 'virtual') {
      const interval = virtualIntervals.get(sessionId);
      if (interval) {
        clearInterval(interval);
        virtualIntervals.delete(sessionId);
      }
    } else if (activeConnections.has(portPath)) {
      const connection = activeConnections.get(portPath);
      connection.parser.removeAllListeners('data');
      connection.port.close((err) => {
        if (err) {
          console.error('Error Closing Port:', err);
        }
      });
      activeConnections.delete(portPath);
    }

    try {
      const sessionDataArray = sessionData.get(sessionId);
      if (sessionDataArray && sessionDataArray.length > 0) {
        const filename = await saveDataToCSV(sessionId, sessionDataArray);
        socket.emit('csvSaved', { filename });
        sessionDataArray.length = 0;
      }
    } catch (err) {
      console.error('Error Saving Session Data:', err);
      socket.emit('error', { message: 'Failed to save session data: ' + err.message });
    }

    socket.emit('status', { connected: false, port: portPath });
  });

  socket.on('disconnect', () => {
    console.log('Client Disconnected:', socket.id);

    const interval = virtualIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      virtualIntervals.delete(sessionId);
    }

    for (const [portPath, connection] of activeConnections.entries()) {
      connection.parser.removeAllListeners('data');
      connection.port.close((err) => {
        if (err) {
          console.error('Error Closing Port On Disconnect:', err);
        }
      });
      activeConnections.delete(portPath);
    }

    sessionData.delete(sessionId);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server Running On Port: ${PORT}`);
});