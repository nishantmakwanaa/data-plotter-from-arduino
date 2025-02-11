import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

class SerialPortManager {
  constructor() {
    this.ports = new Map();
    this.portListeners = new Map();
    this.updatePortList();
  }

  async updatePortList() {
    try {
      const availablePorts = await SerialPort.list();
      return availablePorts.map(port => ({
        id: port.path,
        name: port.friendlyName || port.path,
        type: 'Arduino',
        status: 'online',
        baudRate: 9600
      }));
    } catch (error) {
      console.error('Error Listing Ports :', error);
      return [];
    }
  }

  async connectToPort(portPath, baudRate = 9600) {
    if (this.ports.has(portPath)) {
      return;
    }

    try {
      const port = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        autoOpen: false
      });

      const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
      
      this.ports.set(portPath, { port, parser });
      
      return new Promise((resolve, reject) => {
        port.open((err) => {
          if (err) {
            this.ports.delete(portPath);
            reject(err);
            return;
          }
          resolve();
        });
      });
    } catch (error) {
      this.ports.delete(portPath);
      throw error;
    }
  }

  disconnectFromPort(portPath) {
    const portInfo = this.ports.get(portPath);
    if (portInfo) {
      portInfo.port.close();
      this.ports.delete(portPath);
      this.portListeners.delete(portPath);
    }
  }

  onData(portPath, callback) {
    const portInfo = this.ports.get(portPath);
    if (portInfo) {
      const listener = (data) => {
        try {
          const [x, y] = data.trim().split(',').map(Number);
          if (!isNaN(x) && !isNaN(y)) {
            callback({
              x,
              y,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('Error Parsing Data :', error);
        }
      };
      
      portInfo.parser.on('data', listener);
      this.portListeners.set(portPath, listener);
    }
  }

  removeDataListener(portPath) {
    const portInfo = this.ports.get(portPath);
    const listener = this.portListeners.get(portPath);
    
    if (portInfo && listener) {
      portInfo.parser.removeListener('data', listener);
      this.portListeners.delete(portPath);
    }
  }
}

export const serialPortManager = new SerialPortManager();