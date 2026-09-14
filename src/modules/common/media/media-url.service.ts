import { Injectable } from '@nestjs/common';
import EnvironmentConfiguration from 'src/config/env.config';
import { Media } from './entities/media.entity';
import { SpacesService } from './spaces.service';

@Injectable()
export class MediaUrlService {
  constructor(private readonly spacesService: SpacesService) {}

  async resolveUrl(media: Media): Promise<string> {
    if (media.storageType === 'local') {
      const base = EnvironmentConfiguration.BASE_URL.replace(/\/$/, '');
      return `${base}/uploads/${media.storagePath.replace(/^\/+/, '')}`;
    }
    return this.spacesService.getSignedUrl(media.storagePath);
  }
}
