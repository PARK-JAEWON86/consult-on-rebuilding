import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema<any>) {}

  transform(value: any, _: ArgumentMetadata) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'E_VALIDATION',
          message: 'Validation failed',
          details: result.error.errors,
        },
      });
    }
    return result.data;
  }
}
