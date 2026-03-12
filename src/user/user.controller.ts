import { Body, Controller, Delete, Param, Post, Put, Query, UseGuards, UseInterceptors,Request } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserDto } from "./dto/UserDto";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PaginationDto } from "./dto/PaginationDto";

@ApiTags("user")
@Controller("/user")
export class UserController{
    constructor(private readonly userService: UserService){}

    @Put("/add")
    async addUser(@Body() userDto:UserDto){
        return await this.userService.create(userDto)
    }

    @Post("/findAll")
    @UseGuards(JwtAuthGuard)
    async findAll(@Body() pagination:PaginationDto){
        return await this.userService.findAll(pagination)
    }

    @Post("/updateUser")
    @UseGuards(JwtAuthGuard)
    async updateUser(@Body() userDto:UserDto){
        return this.userService.updateUser(userDto);
    }
    @Post("/resetById")
    @UseGuards(JwtAuthGuard)
    async resetUser(@Body() userDto:UserDto ){
        return this.userService.resetUser(userDto)
    }

    @Delete("/deleteById")
    @UseGuards(JwtAuthGuard)
    async removeUser(@Query("id") id:string){
        return this.userService.deleteById(id);
    }

    @Post("/updateNickName")
    @UseGuards(JwtAuthGuard)
    async updateNickName(@Body() userDto:UserDto, @Request() req:any){  
        return this.userService.updateNickName(req.user.id,userDto.nickName||'');
    }
}