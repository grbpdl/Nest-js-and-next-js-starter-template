import { Module } from '@nestjs/common';
import { LiveGateway } from './live/live.gateway';

@Module({
  providers: [LiveGateway],
})
export class gatewayModule {}
