import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ExceptionFilterGlobal implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (
      typeof exception == 'object' &&
      'message' in exception! &&
      'status' in exception
    ) {
      response.status(exception.status as number).json({
        message: exception.message || 'Server Error',
        statusCode: exception.status || 500,
      });
    } else {
      response.status(500).json({
        message: 'Server Error',
        statusCode: 500,
      });
    }
  }
}
