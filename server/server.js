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

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const csvFilePath = join(__dirname, 'data/data.csv');
const csvWriter = createObjectCsvWriter({
  path: csvFilePath,
  header: [
    { id: 'timestamp', title: 'TIMESTAMP' },
    { id: 'originalData', title: 'ORIGINAL_DATA' },
    { id: 'multipliedData', title: 'MULTIPLIED_DATA' },
    { id: 'dividedData', title: 'DIVIDED_DATA' }
  ]
});

if (!fs.existsSync(csvFilePath)) {
  fs.writeFileSync(csvFilePath, 'TIMESTAMP,ORIGINAL_DATA,MULTIPLIED_DATA,DIVIDED_DATA\n');
}

let isGeneratingData = false;
let arduinoPort = null;
let multiplyFactor = 2;
let divideFactor = 2;

app.post('/update-factors', express.json(), (req, res) => {
  const { multiply, divide } = req.body;
  if (multiply) multiplyFactor = parseFloat(multiply);
  if (divide) divideFactor = parseFloat(divide);
  res.json({ multiplyFactor, divideFactor });
});

app.get('/historical-data', (req, res) => {
  const results = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => {
      results.push({
        timestamp: parseInt(data.TIMESTAMP),
        originalData: parseFloat(data.ORIGINAL_DATA),
        multipliedData: parseFloat(data.MULTIPLIED_DATA),
        dividedData: parseFloat(data.DIVIDED_DATA)
      });
    })
    .on('end', () => {
      res.json(results);
    })
    .on('error', (error) => {
      res.status(500).json({ error: 'Failed To Read Historical Data.' });
    });
});

const processAndEmitData = (originalData) => {
  const timestamp = Date.now();
  const multipliedData = originalData * multiplyFactor;
  const dividedData = originalData / divideFactor;

  const dataPoint = {
    timestamp,
    originalData,
    multipliedData,
    dividedData
  };

  io.emit('medicalData', dataPoint);
  csvWriter.writeRecords([dataPoint]);
};

const generateSimulatedData = () => {
  if (!isGeneratingData) return;

  const baseHeartRate = 75;
  const variation = Math.random() * 10 - 5;
  const simulatedHeartRate = baseHeartRate + variation;
  
  processAndEmitData(simulatedHeartRate);
  setTimeout(generateSimulatedData, 1000);
};

const connectToArduino = () => {
  SerialPort.list().then(ports => {
    const arduinoPort = ports.find(port => port.manufacturer?.includes('Arduino'));
    if (arduinoPort) {
      const port = new SerialPort({
        path: arduinoPort.path,
        baudRate: 9600
      });
      port.on('data', (data) => {
        const value = parseFloat(data.toString());
        if (!isNaN(value)) {
          processAndEmitData(value);
        }
      });
    } else {
      console.log('No Arduino Found, Using Simulated Data.');
    }
  }).catch(err => {
    console.log('Error Connecting To Arduino, Using Simulated Data.');
  });
};

io.on('connection', (socket) => {
  console.log('Client Connected.');

  socket.on('startMonitoring', () => {
    isGeneratingData = true;
    generateSimulatedData();
  });

  socket.on('stopMonitoring', () => {
    isGeneratingData = false;
  });

  socket.on('disconnect', () => {
    console.log('Client Disconnected.');
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server Running On Port : ${PORT}`);
  connectToArduino();
});