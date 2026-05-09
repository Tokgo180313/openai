import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateTaskImageHistoryDto } from './dto/create-task-image-history.dto';
import { QueryTaskImageHistoryDto } from './dto/query-task-image-history.dto';
import { UpdateTaskImageHistoryDto } from './dto/update-task-image-history.dto';
import { TaskImageService } from './taskImage.service';

@ApiTags('taskImage')
@ApiBearerAuth('access_token')
@Controller('/taskImage')
export class TaskImageController {
  constructor(private readonly taskImageService: TaskImageService) {}

  /** 新增生成图片历史 */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateTaskImageHistoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskImageService.create(dto, userId);
  }

  /** 分页查询当前登录用户的历史记录 */
  @Post('/page')
  @UseGuards(JwtAuthGuard)
  async page(
    @Body() query: QueryTaskImageHistoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskImageService.findPage(query, userId);
  }

  /** 更新一条记录（仅能更新本人数据） */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskImageHistoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskImageService.update(id, dto, userId);
  }
}
