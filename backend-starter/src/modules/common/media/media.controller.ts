import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { MediaService } from './media.service';
import { ApiAuth } from 'src/shared/swagger/api-auth.decorator';
import { ApiSuccessResponseDto } from 'src/shared/swagger/api-response.dto';

@ApiTags('Media')
@Controller('media')
@UseGuards(AuthGuard)
@ApiAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload a file',
    description:
      'Stores locally or on DigitalOcean Spaces based on STORAGE_TYPE. Max 10MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (max 10MB)',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ApiSuccessResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: any },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const media = await this.mediaService.upload(file, req.user.id);
    return {
      statusCode: HttpStatus.CREATED,
      error: false,
      message: 'File uploaded successfully',
      data: {
        id: media.id,
        fileName: media.fileName,
        originalName: media.originalName,
        fileType: media.fileType,
        fileSize: media.fileSize,
        storageType: media.storageType,
        url: media.url,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media metadata + resolved URL' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: any },
  ) {
    const data = await this.mediaService.getForUser(id, req.user);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Media retrieved successfully',
      data,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media (owner or admin)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: any },
  ) {
    await this.mediaService.remove(id, req.user);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'Media deleted successfully',
    };
  }
}
