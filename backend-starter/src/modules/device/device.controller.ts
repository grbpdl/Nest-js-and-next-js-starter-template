import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { ApiAuth } from 'src/shared/swagger/api-auth.decorator';
import {
  ApiErrorResponseDto,
  ApiSuccessResponseDto,
} from 'src/shared/swagger/api-response.dto';
import { DeviceService } from './device.service';
import { RegisterFcmDto } from './dto/device-context.dto';
import { getClientIp, getUserAgent } from './utils/request-meta';

@ApiTags('Device')
@ApiAuth()
@UseGuards(AuthGuard)
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Get()
  @ApiOperation({
    summary: 'List my devices',
    description: 'IP, platform, last seen, and whether an FCM token is set.',
  })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async listMine(@Request() req: { user: { id: string } }) {
    const data = await this.deviceService.listForUser(req.user.id);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Devices retrieved successfully',
      data,
    };
  }

  @Post('fcm')
  @ApiOperation({
    summary: 'Register or update FCM token for a device',
    description: 'Call after login when the mobile app obtains an FCM token.',
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  async registerFcm(
    @Request() req: { user: { id: string }; ip?: string; headers: any },
    @Body() body: RegisterFcmDto,
  ) {
    const data = await this.deviceService.upsertDevice({
      userId: req.user.id,
      deviceId: body.deviceId,
      fcmToken: body.fcmToken,
      deviceInfo: body.deviceInfo,
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });
    return {
      statusCode: HttpStatus.CREATED,
      error: false,
      message: 'FCM token registered',
      data,
    };
  }

  @Delete(':deviceId')
  @ApiOperation({
    summary: 'Remove a device',
    description: 'Deletes the device record and its FCM token.',
  })
  @ApiParam({ name: 'deviceId', example: 'device-abc-123' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  async remove(
    @Request() req: { user: { id: string } },
    @Param('deviceId') deviceId: string,
  ) {
    await this.deviceService.removeDevice(req.user.id, deviceId);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Device removed',
    };
  }
}
