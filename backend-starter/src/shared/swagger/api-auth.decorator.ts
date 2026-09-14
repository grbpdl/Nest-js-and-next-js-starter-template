import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from './api-response.dto';

/**
 * Documents dual auth: httpOnly cookie (browser) or Bearer JWT (mobile).
 */
export function ApiAuth() {
  return applyDecorators(
    ApiCookieAuth('access_token'),
    ApiBearerAuth('bearer'),
    ApiUnauthorizedResponse({
      description:
        'Missing or invalid access_token cookie / Authorization Bearer token',
      type: ApiErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'Authenticated but lacking required role/permission',
      type: ApiErrorResponseDto,
    }),
  );
}
