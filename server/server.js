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
  console.error('Error Creating Data Directory :', err);
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

async function saveDataToCSV(sessionId, data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `medical_data_${sessionId}_${timestamp}.csv`;
  const filepath = join(dataDir, filename);
  
  const csvContent = [
    'Timestamp,Original,Processed,Relation',
    ...data.map(d => `${d.timestamp},${d.original},${d.processed},${d.relation}`)
  ].join('\n');

  try {
    await fs.writeFile(filepath, csvContent);
    console.log(`Data Saved To ${filepath}`);
    return filename;
  } catch (err) {
    console.error('Error Saving CSV :', err);
    throw err;
  }
}

async function checkPortStatus(portPath) {
  try {
    const port = new SerialPort({
      path: portPath,
      baudRate: 9600,
      autoOpen: false
    });
    
    return new Promise((resolve) => {
      port.open((err) => {
        if (err) {
          resolve('offline');
        } else {
          port.close();
          resolve('online');
        }
      });
    });
  } catch (err) {
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
        name: port.path,
        type: port.manufacturer || 'Unknown',
        status: status
      };
    }));

    portsWithStatus.push({
      id: 'localhost',
      name: 'Localhost',
      type: 'Virtual',
      status: 'online'
    });

    portsWithStatus.push({
      id: 'raspberry',
      name: 'Raspberry Pi',
      type: 'Virtual',
      status: 'online'
    });

    return portsWithStatus;
  } catch (err) {
    console.error('Error Listing Serial Ports :', err);
    return [{
      id: 'localhost',
      name: 'Localhost',
      type: 'Virtual',
      status: 'online'
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

setInterval(updatePorts, 5000);

function connectArduino(portPath) {
  const port = new SerialPort({
    path: portPath,
    baudRate: 9600
  });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
  return { port, parser };
}

function generateLocalhostData() {
  const timestamp = Date.now();
  return Math.sin(timestamp / 1000) * 50 + 50;
}

io.on('connection', async (socket) => {
  console.log('Client Connected.');
  const sessionId = socket.id;
  sessionData.set(sessionId, []);
  
  const ports = await listSerialPorts();
  socket.emit('ports', ports);

  let dataInterval;

  socket.on('start', async ({ portType, portPath, operation, operationValue }) => {
    if (dataInterval) {
      clearInterval(dataInterval);
    }

    try {
      const emitData = (originalValue) => {
        const timestamp = Date.now();
        let processedValue;
        
        switch (operation) {
          case 'add':
            processedValue = originalValue + operationValue;
            break;
          case 'subtract':
            processedValue = originalValue - operationValue;
            break;
          case 'multiply':
            processedValue = originalValue * operationValue;
            break;
          case 'divide':
            processedValue = operationValue !== 0 ? originalValue / operationValue : originalValue;
            break;
          default:
            processedValue = originalValue;
        }

        const relationValue = processedValue - originalValue;
        
        const sessionDataArray = sessionData.get(sessionId);
        sessionDataArray.push({
          timestamp,
          original: originalValue,
          processed: processedValue,
          relation: relationValue
        });

        socket.emit('data', {
          timestamp,
          original: originalValue,
          processed: processedValue,
          relation: relationValue
        });
      };

      switch (portType) {
        case 'arduino':
          if (activeConnections.has(portPath)) {
            const { parser } = activeConnections.get(portPath);
            parser.on('data', (data) => emitData(parseFloat(data)));
          } else {
            const connection = connectArduino(portPath);
            activeConnections.set(portPath, connection);
            connection.parser.on('data', (data) => emitData(parseFloat(data)));
          }
          break;

        case 'raspberry':
          dataInterval = setInterval(() => {
            emitData(Math.random() * 100);
          }, 1000);
          break;

        case 'localhost':
        default:
          dataInterval = setInterval(() => {
            emitData(generateLocalhostData());
          }, 1000);
          break;
      }
    } catch (err) {
      console.error('Error Starting Data Collection :', err);
      socket.emit('error', { message: 'Failed To Start Data Collection.' });
    }
  });

  socket.on('stop', async ({ portType, portPath }) => {
    if (dataInterval) {
      clearInterval(dataInterval);
    }

    if (portType === 'arduino' && activeConnections.has(portPath)) {
      const connection = activeConnections.get(portPath);
      connection.parser.removeAllListeners('data');
    }

    try {
      const sessionDataArray = sessionData.get(sessionId);
      if (sessionDataArray && sessionDataArray.length > 0) {
        const filename = await saveDataToCSV(sessionId, sessionDataArray);
        socket.emit('csvSaved', { filename });
        sessionDataArray.length = 0;
      }
    } catch (err) {
      console.error('Error Saving Session Data :', err);
      socket.emit('error', { message: 'Failed To Save Session Data.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client Disconnected.');
    if (dataInterval) {
      clearInterval(dataInterval);
    }
    sessionData.delete(sessionId);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server Running On Port : ${PORT}`);
});