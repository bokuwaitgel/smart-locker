import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class DeliveryGateway {
  @WebSocketServer()
  server: Server;
  
  // Your gateway methods here
  @SubscribeMessage('events/:eventId')
  handleEvent(@MessageBody() data: string): string {
      console.log('Received event with data:', data);
  return data;
  }
}