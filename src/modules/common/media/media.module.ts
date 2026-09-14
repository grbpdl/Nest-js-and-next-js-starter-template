import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { FilesController } from './files.controller';
import { SpacesService } from './spaces.service';
import { MediaUrlService } from './media-url.service';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  controllers: [MediaController, FilesController],
  providers: [MediaService, SpacesService, MediaUrlService],
  exports: [MediaService, MediaUrlService],
})
export class MediaModule {}
