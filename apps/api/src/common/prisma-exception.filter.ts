import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientUnknownRequestError,
  Prisma.PrismaClientInitializationError,
  Prisma.PrismaClientRustPanicError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Could not save. Please try again.';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2028' || exception.code === 'P2034') {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Database is busy. Please try again.';
      } else if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'This record already exists.';
      } else if (exception.code === 'P2003' || exception.code === 'P2025') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Related record was not found.';
      } else {
        message = 'Could not save this entry. Please try again.';
      }
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Database is waking up. Please try again.';
    }

    res.status(status).json({
      success: false,
      statusCode: status,
      message,
    });
  }
}
