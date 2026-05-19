import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule,DocumentBuilder } from '@nestjs/swagger';
import { setGlobalDispatcher, ProxyAgent } from 'undici';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  // 仅当配置了代理地址时才走代理（Clash 等默认 HTTP 端口常为 7890）
  const proxyUrl = String(
    process.env.HTTP_PROXY ?? process.env.HTTPS_PROXY ?? '',
  ).trim();
  if (proxyUrl) {
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
  }
  // swagger
  const config = new DocumentBuilder()
                  .setTitle("接口文档")
                  .setVersion("1.0")
                  .addBearerAuth({
                    type:"http",
                    bearerFormat:"JWT",
                    description:"请输入JWT Token",
                    name:"JWT",
                    in:"header"
                  },"access_token")
                  .build();
  const documentFactory = SwaggerModule.createDocument(app,config);
  SwaggerModule.setup("openai",app,documentFactory)
  // 启用 CORS
   // 详细的 CORS 配置
  app.enableCors({
    origin: ['http://localhost:5173','http://127.0.0.1:5173'], // 或使用数组允许多个来源
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Allow-Headers',
      'Access-Control-Request-Method'
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
