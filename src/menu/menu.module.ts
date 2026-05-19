import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './entities/menu.entity';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { RbacModule } from 'src/rbac/rbac.module';

@Module({
  imports: [TypeOrmModule.forFeature([Menu]), RbacModule],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
