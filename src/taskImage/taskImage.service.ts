import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskImageHistory } from './entities/task-image-history.entity';
import { CreateTaskImageHistoryDto } from './dto/create-task-image-history.dto';
import { UpdateTaskImageHistoryDto } from './dto/update-task-image-history.dto';
import { QueryTaskImageHistoryDto } from './dto/query-task-image-history.dto';
import { toTaskImageHistoryRow } from './task-image-history.serialize';

@Injectable()
export class TaskImageService {
  constructor(
    @InjectRepository(TaskImageHistory)
    private readonly repo: Repository<TaskImageHistory>,
  ) {}

  async create(dto: CreateTaskImageHistoryDto, userId: string) {
    const resultImages = dto.result_images ?? [];
    const imageCount =
      dto.image_count ?? (Array.isArray(resultImages) ? resultImages.length : 0);

    const entity = this.repo.create({
      userId,
      taskId: dto.task_id,
      modelName: dto.model_name,
      inputText: dto.input_text,
      sourceImages: dto.source_images ?? [],
      resultImages,
      coverImage: dto.cover_image,
      imageCount,
      aspectRatio: dto.aspect_ratio,
      imageSize: dto.image_size,
      status: dto.status,
      cost: dto.cost ?? 0,
    });

    try {
      const saved = await this.repo.save(entity);
      return toTaskImageHistoryRow(saved);
    } catch (e: unknown) {
      const err = e as { code?: string; errno?: number };
      if (err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062) {
        throw new ConflictException('task_id 已存在');
      }
      throw e;
    }
  }

  async findPage(query: QueryTaskImageHistoryDto, userId: string) {
    const current = query.current ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (current - 1) * pageSize;

    const qb = this.repo
      .createQueryBuilder('h')
      .where('h.userId = :userId', { userId })
      .orderBy('h.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (query.task_id) {
      qb.andWhere('h.taskId = :taskId', { taskId: query.task_id });
    }
    if (query.status !== undefined && query.status !== null) {
      qb.andWhere('h.status = :status', { status: query.status });
    }
    if (query.model_name) {
      qb.andWhere('h.modelName LIKE :mn', { mn: `%${query.model_name}%` });
    }

    const [list, total] = await qb.getManyAndCount();
    return {
      list: list.map(toTaskImageHistoryRow),
      total,
      currentPage: current,
      totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }

  async update(
    id: number,
    dto: UpdateTaskImageHistoryDto,
    userId: string,
  ) {
    const row = await this.repo.findOne({ where: { id, userId } });
    if (!row) {
      throw new NotFoundException('记录不存在');
    }

    if (dto.task_id !== undefined) row.taskId = dto.task_id;
    if (dto.model_name !== undefined) row.modelName = dto.model_name;
    if (dto.input_text !== undefined) row.inputText = dto.input_text;
    if (dto.source_images !== undefined) row.sourceImages = dto.source_images;
    if (dto.result_images !== undefined) row.resultImages = dto.result_images;
    if (dto.cover_image !== undefined) row.coverImage = dto.cover_image;
    if (dto.image_count !== undefined) row.imageCount = dto.image_count;
    if (dto.aspect_ratio !== undefined) row.aspectRatio = dto.aspect_ratio;
    if (dto.image_size !== undefined) row.imageSize = dto.image_size;
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.cost !== undefined) row.cost = dto.cost;

    if (dto.result_images !== undefined && dto.image_count === undefined) {
      row.imageCount = dto.result_images.length;
    }

    try {
      const saved = await this.repo.save(row);
      return toTaskImageHistoryRow(saved);
    } catch (e: unknown) {
      const err = e as { code?: string; errno?: number };
      if (err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062) {
        throw new ConflictException('task_id 已存在');
      }
      throw e;
    }
  }
}
