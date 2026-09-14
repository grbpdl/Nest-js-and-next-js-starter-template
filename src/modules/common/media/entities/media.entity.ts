import { AfterLoad, Column, Entity, Index } from 'typeorm';
import { BaseEntity } from 'src/shared/utils/Helper';
import EnvironmentConfiguration from 'src/config/env.config';

@Entity('media')
@Index('IDX_media_userId', ['userId'])
export class Media extends BaseEntity {
  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'file_type' })
  fileType: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'storage_path' })
  storagePath: string;

  @Column({ name: 'storage_type', default: 'local' })
  storageType: 'local' | 'cloud';

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  /** Populated after load / by MediaUrlService for local files */
  url?: string;

  @AfterLoad()
  generateLocalUrl() {
    if (this.storageType === 'cloud') return;
    const base = EnvironmentConfiguration.BASE_URL.replace(/\/$/, '');
    this.url = `${base}/uploads/${this.storagePath.replace(/^\/+/, '')}`;
  }
}
