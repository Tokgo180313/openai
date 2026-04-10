import {
  Body,
  Controller,
  Delete,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/UserDto';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { PaginationDto } from './dto/PaginationDto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
@ApiTags('user')
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put('/add')
  async addUser(@Body() userDto: UserDto,@CurrentUser('id') id: string) {
    return await this.userService.create(userDto,id);
  }

  @Post('/findAll')
  @UseGuards(JwtAuthGuard)
  async findAll(@Body() pagination: PaginationDto) {
    return await this.userService.findAll(pagination);
  }

  @Post('/updateUser')
  @UseGuards(JwtAuthGuard)
  async updateUser(@Body() userDto: UserDto, @CurrentUser('id') id: string) {
    return this.userService.updateUser(userDto,id);
  }
  @Post('/resetById')
  @UseGuards(JwtAuthGuard)
  async resetUser(@Body() userDto: UserDto) {
    return this.userService.resetUser(userDto);
  }

  @Delete('/deleteById')
  @UseGuards(JwtAuthGuard)
  async removeUser(@Query('id') id: string, @CurrentUser('id') userId: string) {
    return this.userService.deleteById(id,userId);
  }

  @Post('/updateNickName')
  @UseGuards(JwtAuthGuard)
  async updateNickName(
    @Body() userDto: UserDto,
    @CurrentUser('id') id: string,
  ) {
    console.log("id",id)
    return this.userService.updateNickName(id, userDto.nickName || '');
  }
}
