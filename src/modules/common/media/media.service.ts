import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v7 as uuid } from 'uuid';
import EnvironmentConfiguration from 'src/config/env.config';
import { Media } from './entities/media.entity';
import { SpacesService } from './spaces.service';
import { MediaUrlService } from './media-url.service';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly spacesService: SpacesService,
    private readonly mediaUrlService: MediaUrlService,
  ) {}

  async upload(
    file: Express.Multer.File,
    userId: string,
  ): Promise<Media & { url: string }> {
    const ext = path.extname(file.originalname) || '';
    const fileName = `${uuid()}${ext}`;
    const storageType = EnvironmentConfiguration.STORAGE_TYPE;

    let storagePath: string;

    if (storageType === 'cloud') {
      const key = `${EnvironmentConfiguration.UPLOAD_DIR_CLOUD}/${userId}/${fileName}`;
      storagePath = await this.spacesService.uploadFile({
        key,
        body: file.buffer,
        contentType: file.mimetype,
      });
    } else {
      const dir = path.join(
        EnvironmentConfiguration.UPLOAD_DIR_LOCAL,
        userId,
      );
      await fs.mkdir(dir, { recursive: true });
      const fullPath = path.join(dir, fileName);
      await fs.writeFile(fullPath, file.buffer);
      storagePath = path.posix.join(userId, fileName);
    }

    const media = this.mediaRepository.create({
      fileName,
      originalName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      storagePath,
      storageType,
      userId,
    });
    const saved = await this.mediaRepository.save(media);
    const url = await this.mediaUrlService.resolveUrl(saved);
    return Object.assign(saved, { url });
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async getForUser(
    id: string,
    user: { id: string; roles?: { name: string }[] },
  ) {
    const media = await this.findOne(id);
    this.assertCanAccess(media, user);
    const url = await this.mediaUrlService.resolveUrl(media);
    return { ...media, url };
  }

  async remove(
    id: string,
    user: { id: string; roles?: { name: string }[] },
  ) {
    const media = await this.findOne(id);
    this.assertCanAccess(media, user);

    if (media.storageType === 'cloud') {
      await this.spacesService.deleteFile(media.storagePath);
    } else {
      const fullPath = path.join(
        EnvironmentConfiguration.UPLOAD_DIR_LOCAL,
        media.storagePath,
      );
      await fs.unlink(fullPath).catch(() => undefined);
    }

    await this.mediaRepository.delete(id);
    return true;
  }

  private assertCanAccess(
    media: Media,
    user: { id: string; roles?: { name: string }[] },
  ) {
    const isAdmin = user.roles?.some((r) =>
      ['super_admin', 'admin'].includes(r.name),
    );
    if (media.userId && media.userId !== user.id && !isAdmin) {
      throw new ForbiddenException('You cannot access this media');
    }
  }
}
