import { Injectable, Logger } from '@nestjs/common';
import { SerialPort } from 'serialport';
import type { SerialPort as SerialPortType } from 'serialport';

@Injectable()
export class SerialService {
  private port: SerialPortType | null = null;
  private logger = new Logger('SerialService');
  private isConnected = false;

  async openConnection(path = '/dev/ttyS3', baudRate = 9600): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.port) return resolve('Already connected');
      this.port = new SerialPort({ path, baudRate }, (err) => {
        if (err) {
          this.logger.error('Failed to open serial port: ' + err.message);
          this.isConnected = false;
          return reject(err.message);
        } else {
          this.logger.log('Serial port opened');
          this.isConnected = true;
          resolve('Serial port opened');
        }
      });
    });
  }

  // ---- NEW: Board check ----
  async checkBoard(boardId = 1): Promise<string> {
    if (!this.isConnected || !this.port) throw new Error('Serial port not connected');
    // Example: [0xC1, boardId] as a "ping board" command
    const command = Buffer.from([0xC1, boardId]);
    return new Promise((resolve, reject) => {
      this.port!.write(command, (err) => {
        if (err) {
          this.logger.error('Board check error: ' + err.message);
          return reject(err.message);
        }
        this.port!.once('data', (data: Buffer) => {
          this.logger.log('Board check response: ' + data.toString('hex'));
          // You can parse ACK/NACK here as needed
          resolve(data.toString('hex'));
        });
        setTimeout(() => reject('Timeout waiting for board response'), 1000);
      });
    });
  }

  // ---- NEW: Get all locker status ----
  async getAllLockerStatus(boardId = 1): Promise<{ raw: string, doors: boolean[] }> {
    if (!this.isConnected || !this.port) throw new Error('Serial port not connected');
    // Example: [0xB1, boardId] as a "get all status" command
    const command = Buffer.from([0xB1, boardId]);
    return new Promise((resolve, reject) => {
      this.port!.write(command, (err) => {
        if (err) {
          this.logger.error('Get all locker status error: ' + err.message);
          return reject(err.message);
        }
        this.port!.once('data', (data: Buffer) => {
          this.logger.log('Locker status raw data: ' + data.toString('hex'));
          // Example parse: suppose each bit is one locker (bit0=door1, etc)
          // E.g., for 16 lockers: 2 bytes, bit=1=open, bit=0=closed
          let doors: boolean[] = [];
          for (let i = 0; i < data.length * 8; i++) {
            const byteIdx = Math.floor(i / 8);
            const bitIdx = i % 8;
            const isOpen = (data[byteIdx] >> bitIdx) & 1;
            doors.push(!!isOpen);
          }
          resolve({ raw: data.toString('hex'), doors });
        });
        setTimeout(() => reject('Timeout waiting for locker status'), 1000);
      });
    });
  }

  async closeConnection(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.port && this.isConnected) {
        this.port.close((err) => {
          if (err) {
            this.logger.error('Failed to close serial port: ' + err.message);
            return reject(err.message);
          }
          this.logger.log('Serial port closed');
          this.isConnected = false;
          this.port = null;
          resolve('Serial port closed');
        });
      } else {
        resolve('Serial port was not open');
      }
    });
  }

  isOpen(): boolean {
    return this.isConnected;
  }

  async openLocker(boardId: number, doorId: number): Promise<string> {
    if (!this.isConnected || !this.port) throw new Error('Serial port not connected');
    // TODO: Replace below command with your real hardware protocol!
    const command = Buffer.from([0xA1, boardId, doorId]);
    return new Promise((resolve, reject) => {
      this.port!.write(command, (err) => {
        if (err) {
          this.logger.error('Open locker error: ' + err.message);
          return reject(err.message);
        }
        resolve('Open locker command sent');
      });
    });
  }

  async getAllStatus(boardId = 1): Promise<string> {
    if (!this.isConnected || !this.port) throw new Error('Serial port not connected');
    // TODO: Replace below command with your real hardware protocol!
    const command = Buffer.from([0xB1, boardId]);
    return new Promise((resolve, reject) => {
      this.port!.write(command, (err) => {
        if (err) {
          this.logger.error('Get status error: ' + err.message);
          return reject(err.message);
        }
        // Listen for a single response
        this.port!.once('data', (data: Buffer) => {
          this.logger.log('Received status data: ' + data.toString('hex'));
          resolve(data.toString('hex')); // parse as needed
        });
        setTimeout(() => reject('Timeout waiting for status response'), 1000);
      });
    });
  }
}
