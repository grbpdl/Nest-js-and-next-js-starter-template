import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Standard success envelope used across the API */
export class ApiSuccessResponseDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: false })
  error: boolean;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiPropertyOptional()
  data?: unknown;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: true })
  error: boolean;

  @ApiProperty({ example: 'BadRequest' })
  type?: string;

  @ApiProperty({ example: 'Something went wrong' })
  message: string;
}
