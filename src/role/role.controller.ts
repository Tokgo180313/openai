import { Controller } from "@nestjs/common";
import { RoleService } from "./role.service";
import { ApiTags } from "@nestjs/swagger";
import { CreateRoleDto, RoleDto } from "./dto/role.dto";
import { Body, Delete, Post, Put ,Query} from "@nestjs/common";

@ApiTags('role')
@Controller('/role')
export class RoleController {
    constructor(private roleService: RoleService) {}

    @Put("/add")
    async createRole(@Body() roleDto: CreateRoleDto) {
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