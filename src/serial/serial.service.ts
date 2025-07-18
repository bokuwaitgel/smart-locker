import { Injectable, Logger } from '@nestjs/common';
import SerialPort from 'serialport';
import { SerialPort as SerialPortType } from 'serialport';

@Injectable()
export class SerialService {
  private port: SerialPortType | null = null;
  private logger = new Logger('SerialService');
  private isConnected = false;

  async openConnection(path = '/dev/ttyUSB0', baudRate = 9600): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.port) return resolve('Already connected');
      this.port = new SerialPortType({ path, baudRate }, (err) => {
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
