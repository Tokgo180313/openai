import {
  Body,
  Controller,
  Delete,
  NotFoundException,
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
import { RecordService } from 'src/record/record.service';

@ApiTags('user')
@Controller('/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly recordService: RecordService,
  ) {}

  /**
   * 操作日志：写入操作者昵称、账号及描述（含目标账号时与既有格式 `动作:目标账号` 一致）
   */
  private async appendOperationLog(
    operatorId: string | undefined,
    action: string,
    targetAccount?: string,
  ): Promise<void> {
    const oid = operatorId?.trim();
    if (!oid) return;
    const op = await this.userService.findById(oid);
    if (!op) {
      throw new NotFoundException('记录失败，操作用户不存在');
    }
    const description = targetAccount
      ? `${action}:${targetAccount}`
      : action;
    await this.recordService.createRecord({
      nickName: op.nickName ?? '',
      account: op.account,
      description,
    });
  }

  @Put('/add')
  async addUser(@Body() userDto: UserDto, @CurrentUser('id') id: string) {
    const user = await this.userService.create(userDto);
    await this.appendOperationLog(id, '用户添加', user.account);
    return user;
  }

  @Post('/findAll')
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Body() pagination: PaginationDto,
    @CurrentUser('id') operatorId: string,
  ) {
    console.log("operatorId",operatorId)
    const result = await this.userService.findAll(pagination);
    await this.appendOperationLog(operatorId, '用户列表查询');
    return result;
  }

  @Post('/updateUser')
  @UseGuards(JwtAuthGuard)
  async updateUser(@Body() userDto: UserDto, @CurrentUser('id') id: string) {
    const user = await this.userService.updateUser(userDto, id);
    await this.appendOperationLog(id, '用户修改', user.account);
    return user;
  }

  @Post('/resetById')
  @UseGuards(JwtAuthGuard)
  async resetUser(
    @Body() userDto: UserDto,
    @CurrentUser('id') operatorId: string,
  ) {
    const user = await this.userService.resetUser(userDto);
    await this.appendOperationLog(operatorId, '密码重置', user.account);
    return user;
  }

  @Delete('/deleteById')
  @UseGuards(JwtAuthGuard)
  async removeUser(@Query('id') id: string, @CurrentUser('id') userId: string) {
    const deletedAccount = await this.userService.deleteById(id, userId);
    await this.appendOperationLog(userId, '用户删除', deletedAccount);
  }

  @Post('/updateNickName')
  @UseGuards(JwtAuthGuard)
  async updateNickName(
    @Body() userDto: UserDto,
    @CurrentUser('id') id: string,
  ) {
    const user = await this.userService.updateNickName(id, userDto.nickName || '');
    await this.appendOperationLog(id, '昵称修改', user.account);
    return user;
  }
}
