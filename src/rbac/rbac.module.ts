import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRole } from './entities/user-role.entity';
import { RoleMenu } from './entities/role-menu.entity';
import { Role } from 'src/role/entities/role.entity';
import { Menu } from 'src/menu/entities/menu.entity';
import { RbacService } from './rbac.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole, RoleMenu, Role, Menu])],
  providers: [RbacService],
  exports: [RbacService, TypeOrmModule],
})
export class RbacModule {}
