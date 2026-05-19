import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { RbacModule } from 'src/rbac/rbac.module';
import { RoleMenu } from 'src/rbac/entities/role-menu.entity';
import { OperationLogModule } from 'src/common/operation-log/operation-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Menu, RoleMenu]),
    RbacModule,
    OperationLogModule,
  ],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
