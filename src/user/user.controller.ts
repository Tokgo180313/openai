import { Body, Controller, Delete, Post, Put, UseGuards, UseInterceptors } from "@nestjs/common";
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

    @Delete("/deleteById:id")
    @UseGuards(JwtAuthGuard)
    async removeUser(id:string){
        return this.userService.deleteById(id);
    }

}