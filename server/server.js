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
const portStatusCache = new Map();

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

  const cachedStatus = portStatusCache.get(portPath);
  if (cachedStatus && (Date.now() - cachedStatus.timestamp) < 2000) {
    return cachedStatus.status;
  }

  try {
    const port = new SerialPort({
      path: portPath,
      baudRate: 9600,
      autoOpen: false
    });
    
    const status = await new Promise((resolve) => {
      port.open((err) => {
        if (err) {
          resolve('offline');
        } else {

          port.write('\x00', (err) => {
            if (err) {
              resolve('error');
            } else {
              resolve('online');
            }
            port.close();
          });
        }
      });
    });

    portStatusCache.set(portPath, {
      status,
      timestamp: Date.now()
    });

    return status;
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
        name: port.friendlyName || port.path,
        type: port.manufacturer || 'Unknown',
        status: status,
        vendorId: port.vendorId,
        productId: port.productId,
        serialNumber: port.serialNumber
      };
    }));

    const virtualPorts = [
      {
        id: 'localhost',
        name: 'LocalHost Simulation',
        type: 'Virtual',
        status: 'online'
      }
    ];

    try {
      const isRaspberryPi = await fs.access('/dev/ttyAMA0')
        .then(() => true)
        .catch(() => false);

      if (isRaspberryPi) {
        virtualPorts.push({
          id: '/dev/ttyAMA0',
          name: 'Raspberry Pi GPIO UART',
          type: 'Hardware',
          status: 'online'
        });
      }
    } catch (err) {
      console.log('Not running on Raspberry Pi');
    }

    return [...portsWithStatus, ...virtualPorts];
  } catch (err) {
    console.error('Error Listing Serial Ports :', err);
    return [{
      id: 'localhost',
      name: 'LocalHost Simulation',
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

setInterval(updatePorts, 2000);

function connectArduino(portPath) {
  const port = new SerialPort({
    path: portPath,
    baudRate: 9600
  });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  port.on('error', (err) => {
    console.error('Serial Port Error :', err);
    io.emit('portError', { port: portPath, error: err.message });
  });

  port.on('close', () => {
    console.log('Port Closed :', portPath);
    io.emit('portDisconnected', { port: portPath });
  });

  return { port, parser };
}

function generateLocalhostData() {
  const timestamp = Date.now();
  return Math.sin(timestamp / 1000) * 50 + 50;
}

io.on('connection', async (socket) => {
  console.log('Client Connected :', socket.id);
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
            parser.on('data', (data) => {
              try {
                const value = parseFloat(data);
                if (!isNaN(value)) {
                  emitData(value);
                }
              } catch (err) {
                console.error('Error Parsing Arduino Data :', err);
              }
            });
          } else {
            const connection = connectArduino(portPath);
            activeConnections.set(portPath, connection);
            connection.parser.on('data', (data) => {
              try {
                const value = parseFloat(data);
                if (!isNaN(value)) {
                  emitData(value);
                }
              } catch (err) {
                console.error('Error Parsing Arduino Data :', err);
              }
            });
          }
          break;

        case 'raspberry':
          try {

            const Serial = (await import('raspi-serial')).default;
            const serial = new Serial();
            serial.open(() => {
              console.log('Raspberry Pi UART Opened.');
              serial.on('data', (data) => {
                try {
                  const value = parseFloat(data);
                  if (!isNaN(value)) {
                    emitData(value);
                  }
                } catch (err) {
                  console.error('Error Parsing Raspberry Pi Data :', err);
                }
              });
            });
          } catch (err) {
            console.log('Falling Back To Simulated Rasp-Berry Pi Data.');
            dataInterval = setInterval(() => {
              emitData(Math.random() * 100);
            }, 1000);
          }
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
      socket.emit('error', { message: 'Failed To Start Data Collection : ' + err.message });
    }
  });

  socket.on('stop', async ({ portType, portPath }) => {
    if (dataInterval) {
      clearInterval(dataInterval);
    }

    if (portType === 'arduino' && activeConnections.has(portPath)) {
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
      console.error('Error Saving Session Data :', err);
      socket.emit('error', { message: 'Failed To Save Session Data : ' + err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client DisConnected :', socket.id);
    if (dataInterval) {
      clearInterval(dataInterval);
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
  console.log(`Server Running On Port : ${PORT}`);
});