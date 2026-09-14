import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';

@Catch(HttpException)
export class HttpExceptionFilter extends ExceptionsHandler {
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();

    response.status(status).json(exception.getResponse());
  }
}
