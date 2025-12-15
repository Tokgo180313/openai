import { Body, Controller, Delete, Param, Post, Put, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserDto } from "./dto/UserDto";
import { ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

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
    async findAll(){
        return await this.userService.findAll()
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
        console.log("id",id)
        return this.userService.deleteById(id);
    }

}