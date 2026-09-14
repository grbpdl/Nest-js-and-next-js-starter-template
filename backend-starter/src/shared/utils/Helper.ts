import { HttpException } from '@nestjs/common';
import {
  ValidationError,
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
  IsString,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import {
  BeforeInsert,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import * as fs from 'fs/promises';

import * as path from 'path';

import { v7 as uuid } from 'uuid';
import EnvironmentConfiguration from 'src/config/env.config';

export const uploadDir = EnvironmentConfiguration.UPLOAD_DIR_LOCAL;

export const handleValidationErrorMessage = (errors: ValidationError[]) => {
  const transformedErrors = errors.map((error) => {
    return {
      property: error.property,
      message: Object.values(error.constraints).join(''),
    };
  });
  return new HttpException(
    {
      data: null,
      statusCode: 422,
      error: true,
      errors: transformedErrors,
    },
    422,
  );
};

export class IdDto {
  @ApiProperty({ format: 'uuid', example: '018f...' })
  @IsString()
  id: string;
}

export const IsDefinedAny = (
  properties: string[],
  validationOptions?: ValidationOptions,
) => {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDefinedAny',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [properties],
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const [relatedProperties] = args.constraints;
          const object = args.object as any;
          return relatedProperties.some(
            (property: string) => object[property] !== undefined,
          );
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedProperties] = args.constraints;
          return `At least one of the following properties must be defined: ${relatedProperties.join(', ')}`;
        },
      },
    });
  };
};

export class BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @CreateDateColumn({ select: false })
  createdAt: Date;

  @UpdateDateColumn({ select: false })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true, select: false })
  deletedAt?: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuid();
    }
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            typeof value === 'string' &&
            value.length >= 8 &&
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /[0-9]/.test(value) &&
            /[^A-Za-z0-9]/.test(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          if (args.value.length < 8) {
            return `Password is too weak. Password must be at least 8 characters long.`;
          }
          if (!/[a-z]/.test(args.value)) {
            return `Password is too weak. Password must contain at least one lowercase letter.`;
          }
          if (!/[A-Z]/.test(args.value)) {
            return `Password is too weak. Password must contain at least one uppercase letter.`;
          }
          if (!/[0-9]/.test(args.value)) {
            return `Password is too weak. Password must contain at least one number.`;
          }
          if (!/[!@#$%^&*]/.test(args.value)) {
            return `Password is too weak. Password must contain at least one special character.`;
          }
          return 'Password is too weak. It must contain at least 8 characters, including uppercase, lowercase, number and special character.';
        },
      },
    });
  };
}

export const moveFile = async (file: any): Promise<string> => {
  try {
    if (
      !(await fs
        .access(uploadDir)
        .then(() => true)
        .catch(() => false))
    ) {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    const oldPath = file.path;
    const newName = `${Date.now().toString()}_${uuid()}.${file.originalname.split('.').pop()}`;
    const newPath = path.join(uploadDir, newName);
    await fs.rename(oldPath, newPath);
    return '/public/uploads/' + newName;
  } catch (error) {
    throw error;
  }
};

export const deleteFile = async (filePath: string): Promise<void> => {
  const cleanedFilePath = filePath.replace('/public/uploads/', '');
  try {
    const fullPath = path.join(uploadDir, cleanedFilePath);
    await fs.unlink(fullPath);
  } catch (error) {
    // throw error;
    console.error(error);
  }
};

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 16;
}
