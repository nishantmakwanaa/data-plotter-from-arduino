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
const virtualIntervals = new Map();

function parseArduinoData(data) {
  const values = {};
  data.split(',').forEach(pair => {
    const [key, value] = pair.trim().split(':').map(s => s.trim());
    if (key && !isNaN(value)) {
      values[key] = parseFloat(value);
    }
  });
  return values;
}

async function saveDataToCSV(sessionId, data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `data_${sessionId}_${timestamp}.csv`;
  const filepath = join(dataDir, filename);

  const csvHeader = 'Index,Y1 Live,Y1 Proceed,Y1 Relational,Y2 Live,Y2 Proceed,Y2 Relational,Y3 Live,Y3 Proceed,Y3 Relational,Y4 Live,Y4 Proceed,Y4 Relational';

  const csvContent = [
    csvHeader,
    ...data.map((d, index) => `${index},${d.Y1Live},${d.Y1Proceed},${d.Y1Relational},${d.Y2Live},${d.Y2Proceed},${d.Y2Relational},${d.Y3Live},${d.Y3Proceed},${d.Y3Relational},${d.Y4Live},${d.Y4Proceed},${d.Y4Relational}`)
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

  if (activeConnections.has(portPath)) {
    return 'online';
  }

  try {
    const port = new SerialPort({
      path: portPath,
      baudRate: 19200,
      autoOpen: false
    });
    
    return new Promise((resolve) => {
      port.open((err) => {
        if (err) {
          console.log(`Port ${portPath} Check Failed :`, err.message);
          resolve('offline');
          return;
        }
        
        resolve('online');
        port.close((err) => {
          if (err) console.error(`Error Closing Port ${portPath} :`, err);
        });
      });
    });
  } catch (err) {
    console.error(`Error Checking Port ${portPath} :`, err);
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
        baudRate: 19200
      };
    }));

    const virtualPort = {
      id: 'virtual',
      name: 'Virtual Data Generator',
      type: 'Virtual',
      status: 'online',
      baudRate: 19200
    };

    return [virtualPort, ...portsWithStatus];
  } catch (err) {
    console.error('Error Listing Serial Ports :', err);
    return [{
      id: 'virtual',
      name: 'Virtual Data Generator',
      type: 'Virtual',
      status: 'online',
      baudRate: 19200
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
    console.error('Error Updating Serial Ports :', err);
  }
}

setInterval(updatePorts, 1000);

function connectArduino(portPath) {
  console.log(`Attempting To Connect To Arduino On ${portPath}`);
  
  const port = new SerialPort({
    path: portPath,
    baudRate: 19200
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  port.on('open', () => {
    console.log(`Successfully Opened Port ${portPath}`);
  });

  port.on('error', (err) => {
    console.error(`Serial Port Error On ${portPath}:`, err);
    io.emit('portError', { port: portPath, error: err.message });
  });

  port.on('close', () => {
    console.log(`Port Closed: ${portPath}`);
    io.emit('portDisconnected', { port: portPath });
    activeConnections.delete(portPath);
  });

  return { port, parser };
}

function generateVirtualData() {
  const time = Date.now() / 1000;
  return {
    Y1Live: Math.sin(time) * 50 + 50 + Math.random() * 5,
    Y1Proceed: Math.sin(time) * 50 + 50 + Math.random() * 5,
    Y1Relational: Math.sin(time) * 50 + 50 + Math.random() * 5,
    Y2Live: Math.cos(time) * 50 + 50 + Math.random() * 5,
    Y2Proceed: Math.cos(time) * 50 + 50 + Math.random() * 5,
    Y2Relational: Math.cos(time) * 50 + 50 + Math.random() * 5,
    Y3Live: Math.sin(time * 0.5) * 50 + 50 + Math.random() * 5,
    Y3Proceed: Math.sin(time * 0.5) * 50 + 50 + Math.random() * 5,
    Y3Relational: Math.sin(time * 0.5) * 50 + 50 + Math.random() * 5,
    Y4Live: Math.cos(time * 0.5) * 50 + 50 + Math.random() * 5,
    Y4Proceed: Math.cos(time * 0.5) * 50 + 50 + Math.random() * 5,
    Y4Relational: Math.cos(time * 0.5) * 50 + 50 + Math.random() * 5
  };
}

io.on('connection', async (socket) => {
  console.log('Client Connected:', socket.id);
  const sessionId = socket.id;
  sessionData.set(sessionId, []);
  
  const ports = await listSerialPorts();
  socket.emit('ports', ports);

  socket.on('start', async ({ portPath }) => {
    console.log(`Starting Connection To ${portPath}`);
    
    try {
      if (portPath === 'virtual') {
        const interval = setInterval(() => {
          const values = generateVirtualData();
          const timestamp = Date.now();
          const dataPoint = {
            timestamp,
            ...values
          };

          const sessionDataArray = sessionData.get(sessionId);
          if (sessionDataArray) {
            sessionDataArray.push(dataPoint);
            socket.emit('data', dataPoint);
          }
        }, 100);

        virtualIntervals.set(sessionId, interval);
        socket.emit('status', { connected: true, port: portPath });
        return;
      }

      let connection;
      if (!activeConnections.has(portPath)) {
        connection = connectArduino(portPath);
        activeConnections.set(portPath, connection);
        console.log(`New Connection Established To ${portPath}`);
      } else {
        connection = activeConnections.get(portPath);
        console.log(`Using Existing Connection To ${portPath}`);
      }

      connection.parser.on('data', (data) => {
        try {
          const values = parseArduinoData(data);
          if (values.Y1 !== undefined && values.Y2 !== undefined && 
              values.Y3 !== undefined && values.Y4 !== undefined) {
            const timestamp = Date.now();
            const dataPoint = {
              timestamp,
              Y1Live: values.Y1,
              Y1Proceed: values.Y1,
              Y1Relational: values.Y1,
              Y2Live: values.Y2,
              Y2Proceed: values.Y2,
              Y2Relational: values.Y2,
              Y3Live: values.Y3,
              Y3Proceed: values.Y3,
              Y3Relational: values.Y3,
              Y4Live: values.Y4,
              Y4Proceed: values.Y4,
              Y4Relational: values.Y4
            };

            const sessionDataArray = sessionData.get(sessionId);
            if (sessionDataArray) {
              sessionDataArray.push(dataPoint);
              socket.emit('data', dataPoint);
            }
          }
        } catch (err) {
          console.error('Error Parsing Arduino Data :', err);
        }
      });

      socket.emit('status', { connected: true, port: portPath });
    } catch (err) {
      console.error('Error Starting Data Collection:', err);
      socket.emit('error', { message: 'Failed To Start Data Collection : ' + err.message });
    }
  });

  socket.on('stop', async ({ portPath }) => {
    console.log(`Stopping Connection To ${portPath}`);
    
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
          console.error('Error Closing Port :', err);
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
      socket.emit('error', { message: 'Failed To Save Session Data : ' + err.message });
    }

    socket.emit('status', { connected: false, port: portPath });
  });

  socket.on('disconnect', () => {
    console.log('Client Disconnected :', socket.id);

    const interval = virtualIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      virtualIntervals.delete(sessionId);
    }

    for (const [portPath, connection] of activeConnections.entries()) {
      connection.parser.removeAllListeners('data');
      connection.port.close((err) => {
        if (err) {
          console.error('Error Closing Port On Disconnect :', err);
        }
      });
      activeConnections.delete(portPath);
    }

    sessionData.delete(sessionId);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server Running On Port : ${PORT}`);
});