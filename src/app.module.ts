import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptors';
import { MongooseSerializerInterceptor } from './common/interceptors/mongoose-serializer.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { FileModule } from './file/file.module';
import { StreamModule } from './stream/stream.module';
import { ModelsModule } from './models/models.module';
import { RecordModule } from './record/record.module';
import { RoleModule } from './role/role.module';
import { CommonModule } from './common/common.module';
import { UsageModule } from './usage/usage.module';
import { KeyModule } from './key/key.module';
import { ScheduleModule } from './schedule/schedule.module';
import { TaskImageModule } from './taskImage/taskImage.module';
import { AiModelConfigModule } from './aiModelConfig/aiModelConfig.module';
import { MenuModule } from './menu/menu.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('MYSQL_HOST', 'localhost'),
        port: parseInt(config.get<string>('MYSQL_PORT', '3306'), 10),
        username: config.get<string>('MYSQL_USERNAME', 'root'),
        password: config.get<string>('MYSQL_PASSWORD', ''),
        database: config.get<string>('MYSQL_DATABASE', 'nest'),
        charset: 'utf8mb4',
        timezone: '+08:00',
        autoLoadEntities: true,
        synchronize: config.get<string>('MYSQL_SYNCHRONIZE', 'false') === 'true',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),
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
    UsageModule,
    KeyModule,
    ScheduleModule,
    TaskImageModule,
    AiModelConfigModule,
    MenuModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MongooseSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    AppService,
  ],
})
export class AppModule {}
