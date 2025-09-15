import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    
    // 이미 응답이 전송되었는지 확인
    if (response.headersSent) {
      return;
    }
    
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    
    // BadRequestException의 경우 상세 정보 추출
    let errorResponse;
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        errorResponse = response;
      } else {
        errorResponse = {
          code: 'E_VALIDATION',
          message: exception.message || 'Validation failed',
        };
      }
    } else {
      errorResponse = {
        code: exception.code || 'E_INTERNAL',
        message: exception.message || 'Internal server error',
      };
    }

    response.status(status).json({
      success: false,
      error: errorResponse,
    });
  }
}
