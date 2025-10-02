import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Security
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }))

  // Global prefix
  app.setGlobalPrefix('v1')

  // CORS configuration
  app.enableCors({
    origin: [/^http:\/\/localhost:\d+$/],
    credentials: true,
  })

  // Cookie parser
  app.use(cookieParser())

  // Raw body for webhooks with increased size limit for file uploads
  app.use(require('express').json({
    limit: '10mb', // 이미지 업로드를 위한 크기 제한 증가
    verify: (req: any, _res: any, buf: Buffer) => { req.rawBody = buf.toString('utf8'); },
  }))

  // URL-encoded body parser with size limit
  app.use(require('express').urlencoded({
    limit: '10mb',
    extended: true,
  }))

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )

  // Global interceptors and filters
  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new AllExceptionsFilter())

  // Swagger documentation (only in non-production)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Consulton API')
      .setDescription('Expert consultation platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('v1/docs', app, document)
  }

  const port = Number(process.env.PORT ?? 4000)
  await app.listen(port)
  console.log(`[api] listening on http://localhost:${port}/v1/health`)
}

bootstrap()
