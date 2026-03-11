import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptors';
import { HttpExecptionFilter } from './common/filters/http-exception.filter';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { FileModule } from './file/file.module';
import { StreamModule } from './stream/stream.module';
import { ModelsModule } from './models/models.module';
import { RecordModule } from './record/record.module';
import { RoleModule } from './role/role.module';
import { CommonModule } from './common/common.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/nest', {
      autoIndex: true,
    }),
    ChatModule,
    UserModule,
    FileModule,
    AuthModule,
    StreamModule,
    ModelsModule,
    RecordModule,
    RoleModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExecptionFilter,
    },
    AppService,
  ],
})
export class AppModule {}
