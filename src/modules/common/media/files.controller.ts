import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/modules/auth/guards/auth.guard';
import { MediaService } from './media.service';
import { ApiAuth } from 'src/shared/swagger/api-auth.decorator';
import { ApiSuccessResponseDto } from 'src/shared/swagger/api-response.dto';

@ApiTags('Files')
@Controller('files')
@UseGuards(AuthGuard)
@ApiAuth()
export class FilesController {
  constructor(private readonly mediaService: MediaService) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Resolve file access payload',
    description: 'Returns id, mime type, and signed/local URL.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async getFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: any },
  ) {
    const data = await this.mediaService.getForUser(id, req.user);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'File URL resolved',
      data: { id: data.id, url: data.url, fileType: data.fileType },
    };
  }

  @Get(':id/url')
  @ApiOperation({ summary: 'Resolve file URL only' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: ApiSuccessResponseDto })
  async getUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: any },
  ) {
    const data = await this.mediaService.getForUser(id, req.user);
    return {
      statusCode: HttpStatus.OK,
      error: false,
      message: 'File URL resolved',
      data: { url: data.url },
    };
  }
}
