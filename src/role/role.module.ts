import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OperationLogModule } from "src/common/operation-log/operation-log.module";
import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";
import { Role } from "./entities/role.entity";
import { RbacModule } from "src/rbac/rbac.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Role]),
        OperationLogModule,
        RbacModule,
    ],
    controllers: [RoleController],
    providers: [RoleService],
    exports: [RoleService],
})
export class RoleModule {}