import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { SerialPort } from 'serialport';
import { createObjectCsvWriter } from 'csv-writer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csv from 'csv-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

const csvFilePath = join(__dirname, 'data/data.csv');

if (!fs.existsSync(csvFilePath)) {
  fs.writeFileSync(csvFilePath, 'TIMESTAMP,ORIGINAL_DATA,SOURCE\n');
}

let isGeneratingData = false;
let arduinoPort = null;
let clientsConnected = 0;

const writeToCsv = (dataPoint) => {
  const csvWriter = createObjectCsvWriter({
    path: csvFilePath,
    append: true,
    header: [
      { id: 'timestamp', title: 'TIMESTAMP' },
      { id: 'originalData', title: 'ORIGINAL_DATA' },
      { id: 'source', title: 'SOURCE' }
    ]
  });

  csvWriter.writeRecords([dataPoint]).catch(err => console.error("CSV Write Error :", err));
};

const processAndEmitData = (originalData, source) => {
  const timestamp = Date.now();
  const dataPoint = { timestamp, originalData, source };
  io.emit('medicalData', dataPoint);
  writeToCsv(dataPoint);
};

const generateSimulatedData = () => {
  if (!isGeneratingData) return;
  const simulatedData = 75 + Math.random() * 10 - 5;
  processAndEmitData(simulatedData, 'simulation');
  setTimeout(generateSimulatedData, 1000);
};

const connectToArduino = async () => {
  try {
    const ports = await SerialPort.list();
    const portInfo = ports.find(port => port.manufacturer?.includes('Arduino'));

    if (portInfo) {
      arduinoPort = new SerialPort({ path: portInfo.path, baudRate: 9600 });

      arduinoPort.on('data', (data) => {
        const value = parseFloat(data.toString().trim());
        if (!isNaN(value)) processAndEmitData(value, 'arduino');
      });

      arduinoPort.on('error', (err) => {
        console.error('Arduino Error :', err);
        arduinoPort = null;
      });

      console.log(`Connected To Arduino On ${portInfo.path}`);
    } else {
      console.log('No Arduino Found, Using Simulated Data.');
    }
  } catch (error) {
    console.error("Error Connecting To Arduino :", error);
  }
};

const applyFunction = (data, operation, value) => {
  switch (operation) {
    case 'multiply': return data * value;
    case 'divide': return data / value;
    case 'add': return data + value;
    case 'subtract': return data - value;
    default: return data;
  }
};

app.get('/api/available-ports', async (req, res) => {
  try {
    const ports = await SerialPort.list();
    const usbPorts = ports.filter(port => port.manufacturer?.includes('Arduino') || port.manufacturer?.includes('Raspberry Pi'));

    if (usbPorts.length > 0) {
      res.json(usbPorts.map(port => ({ path: port.path, manufacturer: port.manufacturer })));
    } else {
      res.json([{ path: 'localhost', manufacturer: 'Localhost' }]);
    }
  } catch {
    res.status(500).json({ error: 'Failed To Retrieve Ports.' });
  }
});

app.post('/api/port/live-data', (req, res) => {
  const { port } = req.body;
  if (!port) {
    return res.status(400).json({ error: 'Port is required.' });
  }
  if (port === 'localhost') {
    isGeneratingData = true;
    generateSimulatedData();
    res.json({ message: 'Simulated Data Streaming Started.' });
  } else {
    res.json({ message: `Data Streaming Started On Port ${port}.` });
  }
});

app.post('/api/port/live-data/function', (req, res) => {
  const { operation, value } = req.body;
  if (!['multiply', 'divide', 'add', 'subtract'].includes(operation) || isNaN(value)) {
    return res.status(400).json({ error: 'Invalid Operation Or Value.' });
  }
  res.json({ message: 'Function Applied To Live Data.' });
});

app.get('/api/port/live-data/relation', (req, res) => {
  res.json({ message: 'Relation Between Live Data And Modified Data.' });
});

app.get('/api/read-data', (req, res) => {
  const results = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => results.push({
      timestamp: parseInt(data.TIMESTAMP),
      originalData: parseFloat(data.ORIGINAL_DATA),
      source: data.SOURCE
    }))
    .on('end', () => res.json(results))
    .on('error', () => res.status(500).json({ error: 'Failed To Read Data.' }));
});

app.post('/api/read-data/function', (req, res) => {
  const { operation, value } = req.body;
  if (!['multiply', 'divide', 'add', 'subtract'].includes(operation) || isNaN(value)) {
    return res.status(400).json({ error: 'Invalid Operation Or Value.' });
  }
  const results = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => results.push({
      timestamp: parseInt(data.TIMESTAMP),
      originalData: parseFloat(data.ORIGINAL_DATA),
      modifiedData: applyFunction(parseFloat(data.ORIGINAL_DATA), operation, value),
      source: data.SOURCE
    }))
    .on('end', () => res.json(results))
    .on('error', () => res.status(500).json({ error: 'Failed To Read Data.' }));
});

app.get('/api/read-data/relation', (req, res) => {
  res.json({ message: 'Relation Between CSV Data And Modified CSV Data.' });
});

io.on('connection', (socket) => {
  console.log('Client Connected.');
  clientsConnected++;

  socket.on('startMonitoring', () => {
    if (!isGeneratingData) {
      isGeneratingData = true;
      generateSimulatedData();
    }
  });

  socket.on('stopMonitoring', () => {
    isGeneratingData = false;
  });

  socket.on('disconnect', () => {
    clientsConnected--;
    console.log('Client Disconnected.');
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server Is Running On Port : ${PORT}`);
  connectToArduino();
});