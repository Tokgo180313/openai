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
  // 请确保这里的地址与你本地代理软件（如 Clash, v2ray 等）的 HTTP 端口一致
  const proxyUrl = 'http://127.0.0.1:7890'; 
  const dispatcher = new ProxyAgent(proxyUrl);
  setGlobalDispatcher(dispatcher);
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
