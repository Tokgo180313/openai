import { Controller } from "@nestjs/common";
import { RoleService } from "./role.service";
import { ApiTags } from "@nestjs/swagger";
import { RoleDto } from "./dto/role.dto";
import { Role } from "src/schemas/role/role.schema";
import { Body, Delete, Post, Put ,Query} from "@nestjs/common";

@ApiTags('role')
@Controller('/role')
export class RoleController {
    constructor(private roleService: RoleService) {}

    @Put("/add")
    async createRole(@Body() roleDto: Role) {
        return await this.roleService.createRole(roleDto);
    }

    @Post("/findRoleList")
    async findRoleList(@Body() roleDto: RoleDto) {
        return await this.roleService.findRoleList(roleDto);
    }
    
    @Post("/stop")
    async stopRole(@Query("id") id: string) {
        return await this.roleService.stopRole(id);
    }

    @Post("/start")
    async startRole(@Query("id") id: string) {
        return await this.roleService.startRole(id);
    }
}