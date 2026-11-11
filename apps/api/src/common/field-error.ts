import { BadRequestException } from '@nestjs/common';
import type { FieldError } from '@yc/validation';

/** Throw B-088 field validation without passing validator objects to the client. */
export function throwFieldBadRequest(err: FieldError): never {
  const validationMsg = err.message;
  throw new BadRequestException(validationMsg);
}
