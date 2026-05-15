import {
  BadRequestException,
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  Get,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { CreateTaskImageHistoryDto } from './dto/create-task-image-history.dto';
import { QueryTaskImageHistoryDto } from './dto/query-task-image-history.dto';
import { QueryTaskImageHistoryByTaskIdDto } from './dto/query-task-image-history-by-task-id.dto';
import { UpdateTaskImageHistoryDto } from './dto/update-task-image-history.dto';
import { TaskImageService } from './taskImage.service';
import { TaskImageGenerateDto } from './dto/task-image-generate.dto';
import { TaskImageGenerateImageDto } from './dto/task-image-generate-image.dto';
import { TaskImageUpdateSourceImagesDto } from './dto/task-image-update-source-images.dto';

@ApiTags('taskImage')
@ApiBearerAuth('access_token')
@Controller('/taskImage')
export class TaskImageController {
  constructor(private readonly taskImageService: TaskImageService) {}

  /** 新增生成图片历史 */
  @Post('/create')
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

  /** 按 taskId + 当前用户 + status=1 查询历史记录，不分页 */
  @Post('/historyByTaskId')
  @UseGuards(JwtAuthGuard)
  async historyByTaskId(
    @Body() dto: QueryTaskImageHistoryByTaskIdDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskImageService.findHistoryByTaskIdActive(dto, userId);
  }

  /** 更新一条记录（仅能更新本人数据） */
  @Patch('/update/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskImageHistoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskImageService.update(id, dto, userId);
  }

  /** 新增进行中的生成任务：落库一条记录，status=1 */
  @Post('/addTaskImage')
  @UseGuards(JwtAuthGuard)
  async addTaskImage(
    @Body() dto: TaskImageGenerateDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskImageService.addTaskImage(dto, userId);
  }

  /** 按当前用户 + taskId 更新 task_image 的 sourceImages（仅 status=1） */
  @Post('/updateSourceImages')
  @UseGuards(JwtAuthGuard)
  async updateSourceImages(
    @Body() dto: TaskImageUpdateSourceImagesDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskImageService.updateSourceImages(userId, dto);
  }

  /** 更新 task_image 后调用 OpenAI 兼容接口生成图片，落盘 resultImages 并覆盖 resultImages */
  @Post('/generateImage')
  @UseGuards(JwtAuthGuard)
  async generateImage(
    @Body() dto: TaskImageGenerateImageDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskImageService.generateImage(dto, userId);
  }

  /** 软删除生成记录：将 status 置为 0（Mongo _id） */
  @Patch('/taskDelete/:id')
  @UseGuards(JwtAuthGuard)
  async deleteTaskImage(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.taskImageService.softDeleteGenerate(id, userId);
  }

  /** 按 taskId 查询当前用户进行中的任务（status=1），例：GET .../findTaskImageByTaskId?taskId=1 */
  @Get('/findTaskImageByTaskId')
  @UseGuards(JwtAuthGuard)
  async findTaskImageByTaskId(
    @Query('taskId') taskId: string,
    @CurrentUser('id') userId: string,
  ) {
    const tid = String(taskId ?? '').trim();
    if (!tid) {
      throw new BadRequestException('taskId is required');
    }
    return this.taskImageService.findActiveTaskByTaskId(userId, tid);
  }
}
