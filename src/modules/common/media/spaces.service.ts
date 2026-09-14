import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import EnvironmentConfiguration from 'src/config/env.config';

export interface SpacesUploadInput {
  key: string;
  body: Buffer;
  contentType: string;
  contentDisposition?: string;
  isPublic?: boolean;
}

@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);
  private client?: S3Client;

  get isConfigured(): boolean {
    return Boolean(
      EnvironmentConfiguration.DO_SPACES_ENDPOINT &&
        EnvironmentConfiguration.DO_SPACES_REGION &&
        EnvironmentConfiguration.DO_SPACES_BUCKET &&
        EnvironmentConfiguration.DO_SPACES_ACCESS_KEY_ID &&
        EnvironmentConfiguration.DO_SPACES_SECRET_ACCESS_KEY,
    );
  }

  get defaultExpiresIn(): number {
    return EnvironmentConfiguration.DO_SPACES_SIGNED_URL_EXPIRES;
  }

  async uploadFile(input: SpacesUploadInput): Promise<string> {
    const key = this.normalizeKey(input.key);
    try {
      await this.getClient().send(
        new PutObjectCommand({
          Bucket: EnvironmentConfiguration.DO_SPACES_BUCKET,
          Key: key,
          Body: input.body,
          ContentType: input.contentType,
          ContentDisposition: input.contentDisposition ?? 'inline',
          ACL: input.isPublic ? 'public-read' : 'private',
        }),
      );
    } catch (error) {
      this.logger.error(`Failed to upload "${key}"`, this.describeError(error));
      throw new InternalServerErrorException('Failed to upload file to storage');
    }
    return key;
  }

  async deleteFile(key: string): Promise<void> {
    const normalizedKey = this.normalizeKey(key);
    try {
      await this.getClient().send(
        new DeleteObjectCommand({
          Bucket: EnvironmentConfiguration.DO_SPACES_BUCKET,
          Key: normalizedKey,
        }),
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete "${normalizedKey}"`,
        this.describeError(error),
      );
    }
  }

  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    const normalizedKey = this.normalizeKey(key);
    const ttl =
      Number.isFinite(expiresIn) && (expiresIn as number) > 0
        ? Math.floor(expiresIn as number)
        : this.defaultExpiresIn;

    try {
      return await getSignedUrl(
        this.getClient(),
        new GetObjectCommand({
          Bucket: EnvironmentConfiguration.DO_SPACES_BUCKET,
          Key: normalizedKey,
        }),
        { expiresIn: ttl },
      );
    } catch (error) {
      this.logger.error(
        `Failed to sign "${normalizedKey}"`,
        this.describeError(error),
      );
      throw new InternalServerErrorException('Failed to generate file access URL');
    }
  }

  getPublicUrl(key: string): string {
    const normalizedKey = this.normalizeKey(key);
    if (EnvironmentConfiguration.DO_SPACES_CDN_URL) {
      return `${EnvironmentConfiguration.DO_SPACES_CDN_URL.replace(/\/$/, '')}/${normalizedKey}`;
    }
    const endpoint = String(
      EnvironmentConfiguration.DO_SPACES_ENDPOINT ?? '',
    ).replace(/\/$/, '');
    return `${endpoint}/${EnvironmentConfiguration.DO_SPACES_BUCKET}/${normalizedKey}`;
  }

  private normalizeKey(key: string): string {
    const normalized = String(key ?? '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '')
      .trim();

    if (!normalized) {
      throw new InternalServerErrorException('Storage key is missing');
    }
    if (normalized.split('/').some((segment) => segment === '..')) {
      throw new InternalServerErrorException('Storage key is invalid');
    }
    return normalized;
  }

  private getClient(): S3Client {
    if (!this.isConfigured) {
      throw new InternalServerErrorException('Cloud storage is not configured');
    }
    if (!this.client) {
      this.client = new S3Client({
        endpoint: EnvironmentConfiguration.DO_SPACES_ENDPOINT,
        region: EnvironmentConfiguration.DO_SPACES_REGION,
        credentials: {
          accessKeyId: EnvironmentConfiguration.DO_SPACES_ACCESS_KEY_ID,
          secretAccessKey: EnvironmentConfiguration.DO_SPACES_SECRET_ACCESS_KEY,
        },
        forcePathStyle: false,
        requestHandler: new NodeHttpHandler({
          connectionTimeout: 10_000,
          requestTimeout: 60_000,
        }),
      });
    }
    return this.client;
  }

  private describeError(error: unknown): string {
    const name = (error as { name?: string })?.name ?? 'Error';
    const code = (error as { $metadata?: { httpStatusCode?: number } })
      ?.$metadata?.httpStatusCode;
    return code ? `${name} (HTTP ${code})` : name;
  }
}
