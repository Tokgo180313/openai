import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User,UserSchema } from 'src/schemas/user/user.schema';
import { RecordModule } from 'src/record/record.module';
@Module({
  imports: [
    MongooseModule.forFeature([{ name:User.name, schema: UserSchema }]),
    RecordModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
