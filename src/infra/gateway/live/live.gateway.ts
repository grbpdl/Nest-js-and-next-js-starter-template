import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.ORIGIN,
    methods: 'GET,HEAD,POST,PATCH,DELETE',
    credentials: true,
  },
})
export class LiveGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('LiveGateway');

  @SubscribeMessage('stream')
  handleLive(client: Socket, audioData: Blob): void {
    this.server.emit('live', audioData);
  }

  @SubscribeMessage('signal')
  handleSignal(client: Socket, data: any): void {
    this.server.to(data.to).emit('signal', data);
  }

  afterInit() {
    this.logger.log('Live Server initialized');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}
