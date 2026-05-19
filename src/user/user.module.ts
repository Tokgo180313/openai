import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { RecordModule } from 'src/record/record.module';
import { RbacModule } from 'src/rbac/rbac.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    RecordModule,
    RbacModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
