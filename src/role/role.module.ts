import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OperationLogModule } from "src/common/operation-log/operation-log.module";
import { RoleController } from "./role.controller";
import { RoleService } from "./role.service";
import { Role } from "./entities/role.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([Role]),
        OperationLogModule,
    ],
    controllers: [RoleController],
    providers: [RoleService],
    exports: [RoleService],
})
export class RoleModule {}