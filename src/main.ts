import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule,DocumentBuilder } from '@nestjs/swagger';
import { ResponseInterceptor } from './common/interceptors/response.interceptors';
import { HttpExecptionFilter } from './common/filters/http-exception.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  // 异常过滤器
  app.useGlobalFilters(new HttpExecptionFilter())
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
