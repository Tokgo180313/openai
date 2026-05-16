import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Repository, In } from 'typeorm';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { FileService } from 'src/file/file.service';
import { UsageService } from 'src/usage/usage.service';
import { UsageEntity } from 'src/usage/entity/usage.entity';
import { KeyService } from 'src/key/key.service';
import { EncryptionService } from 'src/common/utils/encryption.service';
import { UserService } from 'src/user/user.service';
import {
  normalizeOpenAIBaseURL,
  OPENAI_DEFAULT_BASE_URL,
} from 'src/common/utils/openai-base-url.util';
import {
  TaskImage,
  TaskImageDocument,
} from 'src/schemas/task-image/task-image.schema';
import { TaskImageHistory } from './entities/task-image-history.entity';
import { CreateTaskImageHistoryDto } from './dto/create-task-image-history.dto';
import { UpdateTaskImageHistoryDto } from './dto/update-task-image-history.dto';
import { QueryTaskImageHistoryDto } from './dto/query-task-image-history.dto';
import { QueryTaskImageHistoryByTaskIdDto } from './dto/query-task-image-history-by-task-id.dto';
import { TaskImageGenerateDto } from './dto/task-image-generate.dto';
import { TaskImageGenerateImageDto } from './dto/task-image-generate-image.dto';
import { TaskImageUpdateSourceImagesDto } from './dto/task-image-update-source-images.dto';
import {
  toTaskImageHistoryRow,
  toTaskImageMongoRow,
} from './task-image-history.serialize';

@Injectable()
export class TaskImageService {
  private readonly resultImagesRoot = join(process.cwd(), 'resultImages');

  constructor(
    @InjectRepository(TaskImageHistory)
    private readonly repo: Repository<TaskImageHistory>,
    @InjectModel(TaskImage.name)
    private readonly taskImageModel: Model<TaskImageDocument>,
    private readonly fileService: FileService,
    private readonly usageService: UsageService,
    private readonly keyService: KeyService,
    private readonly encryptionService: EncryptionService,
    private readonly userService: UserService,
  ) {}

  async create(dto: CreateTaskImageHistoryDto, userId: string) {
    const resultImages = dto.result_images ?? [];
    const imageCount =
      dto.image_count ??
      (Array.isArray(resultImages) ? resultImages.length : 0);

    const entity = this.repo.create({
      userId,
      taskId: dto.task_id,
      modelName: dto.model_name,
      inputText: dto.input_text,
      prompt: null,
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

  /** 发起生成：写入 MongoDB task_image 集合，status 默认为 1（进行中） */
  async addTaskImage(dto: TaskImageGenerateDto, userId: string) {
    try {
      const doc = await new this.taskImageModel({
        userId,
        taskId: dto.taskId,
        modelName: dto.modelName,
        inputText: dto.prompt ?? '',
        prompt: dto.prompt,
        sourceImages: dto.images ?? [],
        resultImages: [],
        imageCount: 0,
        aspectRatio: dto.imageRatio,
        imageSize: dto.imageSize,
        provider: dto.provider,
        status: 1,
        cost: 0,
      }).save();
      return toTaskImageMongoRow(doc);
    } catch (e: unknown) {
      const err = e as { code?: number };
      if (err?.code === 11000) {
        throw new ConflictException('task_id 已存在');
      }
      throw e;
    }
  }

  /** 按 taskId 查询当前用户进行中（status=1）的任务（task_image 集合） */
  async findActiveTaskByTaskId(userId: string, taskId: string) {
    const row = await this.taskImageModel.findOne({
      userId,
      taskId,
      status: 1,
    });
    if (!row) {
      throw new NotFoundException('记录不存在');
    }
    return toTaskImageMongoRow(row);
  }

  /** 按 userId + taskId 更新进行中任务（status=1）的 sourceImages */
  async updateSourceImages(
    userId: string,
    dto: TaskImageUpdateSourceImagesDto,
  ) {
    const taskId = String(dto.taskId ?? '').trim();
    if (!taskId) {
      throw new BadRequestException('taskId is required');
    }
    const row = await this.taskImageModel.findOne({
      userId,
      taskId,
      status: 1,
    });
    if (!row) {
      throw new NotFoundException('记录不存在');
    }
    row.sourceImages = Array.isArray(dto.sourceImages) ? dto.sourceImages : [];
    const saved = await row.save();
    return toTaskImageMongoRow(saved);
  }

  /** 软删除：将 status 置为 0（task_image 集合，id 为 Mongo _id 字符串） */
  async softDeleteGenerate(id: string, userId: string) {
    const sid = String(id ?? '').trim();
    if (!isValidObjectId(sid)) {
      throw new BadRequestException('invalid id');
    }
    const row = await this.taskImageModel.findOne({
      _id: new Types.ObjectId(sid),
      userId,
    });
    if (!row) {
      throw new NotFoundException('记录不存在');
    }
    row.status = 0;
    const saved = await row.save();
    return toTaskImageMongoRow(saved);
  }

  /**
   * 合并更新 task_image → 调 OpenAI 兼容 chat/completions（含 extra_body）→ 记 usage →
   * 将返回中的图片写入 resultImages 目录并覆盖 task_image.resultImages。
   */
  async generateImage(dto: TaskImageGenerateImageDto, userId: string) {
    const taskId = String(dto.taskId ?? '').trim();
    if (!taskId) {
      throw new BadRequestException('taskId is required');
    }

    const row = await this.taskImageModel.findOne({
      userId,
      taskId,
      status: 1,
    });
    if (!row) {
      throw new NotFoundException('记录不存在');
    }

    if (dto.modelName !== undefined) {
      row.modelName = dto.modelName;
    }
    if (dto.inputText !== undefined) {
      row.inputText = dto.inputText;
    }
    if (dto.sourceImages !== undefined) {
      row.sourceImages = Array.isArray(dto.sourceImages)
        ? dto.sourceImages
        : [];
    }
    if (dto.aspectRatio !== undefined) {
      row.aspectRatio = dto.aspectRatio;
    }
    if (dto.imageSize !== undefined) {
      row.imageSize = dto.imageSize;
    }
    if (dto.prompt !== undefined) {
      row.prompt = dto.prompt;
    }
    if (dto.provider !== undefined) {
      row.provider = dto.provider;
    }
    await row.save();

    const modelName = String(row.modelName ?? '').trim();
    if (!modelName) {
      throw new BadRequestException('modelName is required');
    }
    const inputText = String(row.inputText ?? '').trim();
    if (!inputText) {
      throw new BadRequestException('inputText is required');
    }
    const aspectRatio = String(row.aspectRatio ?? '').trim();
    const imageSize = String(row.imageSize ?? '').trim();
    if (!aspectRatio || !imageSize) {
      throw new BadRequestException('aspectRatio and imageSize are required');
    }

    const rawSources = Array.isArray(row.sourceImages) ? row.sourceImages : [];
    const localPaths = rawSources
      .map((s) => String(s ?? '').trim())
      .filter((s) => !!s);

    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [
      { type: 'text', text: inputText },
    ];
    for (const p of localPaths) {
      const dataUrl = await this.fileService.readInputImageAsDataUrl(p, userId);
      userContent.push({
        type: 'image_url',
        image_url: { url: dataUrl },
      });
    }

    const providerForKey = String(dto.provider ?? row.provider ?? '').trim();
    if (!providerForKey) {
      throw new BadRequestException('provider is required');
    }

    const keyDoc = await this.keyService.findKeyByModelClassify(providerForKey);
    if (!keyDoc?.apiKey) {
      throw new NotFoundException(
        `no api key configured for provider: ${providerForKey}`,
      );
    }
    const rawBase = String(keyDoc.baseURL ?? '').trim();
    if (!rawBase) {
      throw new NotFoundException(
        `no baseURL configured for provider: ${providerForKey}`,
      );
    }

    let apiKey: string;
    try {
      apiKey = this.encryptionService.decrypt(keyDoc.apiKey);
    } catch {
      throw new BadRequestException('failed to decrypt stored apiKey');
    }

    const baseURL = normalizeOpenAIBaseURL(rawBase) ?? OPENAI_DEFAULT_BASE_URL;

    const openai = new OpenAI({ apiKey, baseURL });

    const modelClassify = String(keyDoc.modelClassify ?? providerForKey).trim();
    const requestBody = {
      model: modelName,
      stream: false as const,
      messages: [
        {
          role: 'user' as const,
          content: userContent,
        },
      ],
      extra_body: {
        google: {
          image_config: {
            aspect_ratio: aspectRatio,
            image_size: imageSize,
          },
        },
      },
    };

    let response: OpenAI.ChatCompletion;
    try {
      response = (await openai.chat.completions.create(
        requestBody as OpenAI.ChatCompletionCreateParamsNonStreaming,
      )) as OpenAI.ChatCompletion;
    } catch (e: unknown) {
      const err = e as { message?: string };
      throw new BadRequestException(
        String(err?.message ?? e ?? 'OpenAI request failed'),
      );
    }

    const choice = response?.choices?.[0];
    const message = choice?.message as OpenAI.ChatCompletionMessage | undefined;

    const imageItems = await this.extractGeneratedImagesFromMessage(message);
    if (imageItems.length === 0) {
      throw new BadRequestException(
        'model response did not contain a usable image (data URL / image_url / markdown URL)',
      );
    }
    if (response.usage) {
      const usageEntity: UsageEntity = {
        modelName: response.model ?? modelName,
        modelClassify,
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
        status: '0',
        description: `taskImage generate taskId=${taskId}`,
      };
      await this.usageService.addUsage(usageEntity, userId);
    }

    const dateFolder = this.fileService.getImageStorageDateFolder();
    const userDir = join(
      this.resultImagesRoot,
      this.sanitizePathSegment(userId),
      dateFolder,
    );
    await mkdir(userDir, { recursive: true });

    const newPaths: string[] = [];
    for (const { buffer, ext } of imageItems) {
      const name = `${randomUUID()}${ext}`;
      const abs = join(userDir, name);
      await writeFile(abs, buffer);
      newPaths.push(abs);
    }

    row.resultImages = newPaths;
    row.imageCount = row.resultImages.length;
    const saved = await row.save();

    await this.upsertTaskImageHistoryAfterGenerate(
      userId,
      saved,
      newPaths,
      String(response.model ?? modelName ?? '').trim() || modelName,
    );

    return toTaskImageMongoRow(saved);
  }

  /** 生成成功后写入/更新 MySQL task_image_history（同 userId+taskId 则覆盖） */
  private async upsertTaskImageHistoryAfterGenerate(
    userId: string,
    doc: TaskImageDocument,
    resultPaths: string[],
    modelNameResolved: string,
  ): Promise<void> {
    const taskId = String(doc.taskId ?? '').trim();
    if (!taskId) {
      return;
    }

    const existing = await this.repo.findOne({ where: { userId, taskId } });
    const payload: Partial<TaskImageHistory> = {
      modelName: modelNameResolved || String(doc.modelName ?? '').trim() || 'unknown',
      inputText: String(doc.inputText ?? ''),
      prompt: doc.prompt ?? null,
      sourceImages: Array.isArray(doc.sourceImages) ? [...doc.sourceImages] : [],
      resultImages: [...resultPaths],
      coverImage: resultPaths[0] ?? undefined,
      imageCount: resultPaths.length,
      aspectRatio: doc.aspectRatio ?? undefined,
      imageSize: doc.imageSize ?? undefined,
      status: 1,
    };

    if (existing) {
      Object.assign(existing, payload);
      await this.repo.save(existing);
      return;
    }

    const created = this.repo.create({
      userId,
      taskId,
      ...payload,
      cost: 0,
    } as TaskImageHistory);
    await this.repo.save(created);
  }

  private sanitizePathSegment(input: string): string {
    const raw = String(input ?? '').trim();
    const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_');
    return cleaned || 'default';
  }

  private async fetchImageBuffer(url: string): Promise<Buffer | null> {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) {
        return null;
      }
      const ct = String(res.headers.get('content-type') ?? '');
      if (!ct.toLowerCase().startsWith('image/')) {
        return null;
      }
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }

  private extFromDataUrlMime(mime: string): string {
    const m = mime.toLowerCase();
    if (m === 'jpeg' || m === 'jpg') {
      return '.jpg';
    }
    if (m === 'png' || m === 'gif' || m === 'webp' || m === 'bmp') {
      return `.${m}`;
    }
    return '.png';
  }

  private inferExtFromBuffer(buf: Buffer): string {
    if (
      buf.length >= 3 &&
      buf[0] === 0xff &&
      buf[1] === 0xd8 &&
      buf[2] === 0xff
    ) {
      return '.jpg';
    }
    if (
      buf.length >= 8 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    ) {
      return '.png';
    }
    if (buf.length >= 6) {
      const sig = buf.toString('ascii', 0, 6);
      if (sig === 'GIF87a' || sig === 'GIF89a') {
        return '.gif';
      }
    }
    if (
      buf.length >= 12 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return '.webp';
    }
    return '.png';
  }

  private pushDataUrlBase64(
    out: Array<{ buffer: Buffer; ext: string }>,
    dataUrl: string,
  ) {
    const m = /^data:image\/([^;]+);base64,(.+)$/is.exec(
      dataUrl.replace(/\s+/g, ''),
    );
    if (!m) {
      return;
    }
    const mimePart = m[1].toLowerCase();
    const b64 = m[2];
    try {
      const buffer = Buffer.from(b64, 'base64');
      if (!buffer.length) {
        return;
      }
      out.push({
        buffer,
        ext: this.extFromDataUrlMime(mimePart),
      });
    } catch {
      /* ignore */
    }
  }

  private async scanTextForEmbeddedImages(
    text: string,
    visitedUrls: Set<string>,
    out: Array<{ buffer: Buffer; ext: string }>,
  ) {
    const dataUrlRe =
      /data:image\/(?:png|jpeg|jpg|gif|webp|bmp);base64,([A-Za-z0-9+/=\r\n]+)/gi;
    let dm: RegExpExecArray | null;
    while ((dm = dataUrlRe.exec(text)) !== null) {
      this.pushDataUrlBase64(out, dm[0].replace(/\s+/g, ''));
    }

    const mdRe = /!\[[^\]]*]\((https?:\/\/[^)\s]+)\)/g;
    let mm: RegExpExecArray | null;
    while ((mm = mdRe.exec(text)) !== null) {
      const url = mm[1];
      if (visitedUrls.has(url)) {
        continue;
      }
      visitedUrls.add(url);
      const buf = await this.fetchImageBuffer(url);
      if (buf?.length) {
        out.push({ buffer: buf, ext: this.inferExtFromBuffer(buf) });
      }
    }
  }

  private async extractGeneratedImagesFromMessage(
    message: OpenAI.ChatCompletionMessage | undefined,
  ): Promise<Array<{ buffer: Buffer; ext: string }>> {
    const out: Array<{ buffer: Buffer; ext: string }> = [];
    const visitedUrls = new Set<string>();
    const c = message?.content as unknown;

    if (typeof c === 'string') {
      await this.scanTextForEmbeddedImages(c, visitedUrls, out);
      return out;
    }

    if (!Array.isArray(c)) {
      return out;
    }

    for (const p of c as any[]) {
      if (p?.type === 'text' && typeof p.text === 'string') {
        await this.scanTextForEmbeddedImages(p.text, visitedUrls, out);
      }
      if (p?.type === 'image_url' && p.image_url?.url) {
        const url = String(p.image_url.url).trim();
        if (url.startsWith('data:image')) {
          this.pushDataUrlBase64(out, url);
        } else if (url.startsWith('http')) {
          if (visitedUrls.has(url)) {
            continue;
          }
          visitedUrls.add(url);
          const buf = await this.fetchImageBuffer(url);
          if (buf?.length) {
            out.push({ buffer: buf, ext: this.inferExtFromBuffer(buf) });
          }
        }
      }
    }

    return out;
  }

  async findPage(query: QueryTaskImageHistoryDto, userId: string) {
    const current = query.current ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (current - 1) * pageSize;

    const scope = await this.resolveTaskImageHistoryViewerScope(userId);

    const qb = this.repo.createQueryBuilder('h').orderBy('h.createdAt', 'DESC');

    if (scope.mode === 'all') {
      // 角色 0、1：不限制 h.userId
    } else if (scope.mode === 'self') {
      qb.andWhere('h.userId = :scopedUserId', { scopedUserId: userId });
    } else {
      if (scope.userIds.length === 0) {
        qb.andWhere('1 = 0');
      } else {
        qb.andWhere('h.userId IN (:...scopedUserIds)', {
          scopedUserIds: scope.userIds,
        });
      }
    }

    qb.skip(skip).take(pageSize);

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

  /**
   * 角色 0/1：可查全部；2/4：仅本人；3：本人 + roleId=4 且 parent 链上属于本人下级的用户；其它：仅本人。
   */
  private async resolveTaskImageHistoryViewerScope(userId: string): Promise<
    | { mode: 'all' }
    | { mode: 'self' }
    | { mode: 'subordinates'; userIds: string[] }
  > {
    const viewer = await this.userService.findById(userId);
    if (!viewer) {
      throw new NotFoundException('用户不存在');
    }
    const role = String(viewer.roleId ?? '').trim();
    if (role === '0' || role === '1') {
      return { mode: 'all' };
    }
    if (role === '2' || role === '4') {
      return { mode: 'self' };
    }
    if (role === '3') {
      const subIds = await this.userService.findSubordinateUserIdsWithRole(
        userId,
        '4',
      );
      const merged = new Set<string>(subIds);
      merged.add(userId);
      return { mode: 'subordinates', userIds: [...merged] };
    }
    return { mode: 'self' };
  }

  /**
   * 按当前用户、taskId、status=1 查询 task_image_history，不分页。
   * （表上 userId+taskId 唯一时最多一条，仍返回 list 便于扩展）
   */
  async findHistoryByTaskIdActive(
    dto: QueryTaskImageHistoryByTaskIdDto,
    userId: string,
  ) {
    const taskId = String(dto.taskId ?? '').trim();
    if (!taskId) {
      throw new BadRequestException('taskId is required');
    }

    const scope = await this.resolveTaskImageHistoryViewerScope(userId);

    let rows: TaskImageHistory[];
    if (scope.mode === 'all') {
      rows = await this.repo.find({
        where: { taskId, status: 1 },
        order: { createdAt: 'DESC' },
      });
    } else if (scope.mode === 'self') {
      rows = await this.repo.find({
        where: { userId, taskId, status: 1 },
        order: { createdAt: 'DESC' },
      });
    } else if (scope.userIds.length === 0) {
      rows = [];
    } else {
      rows = await this.repo.find({
        where: { taskId, status: 1, userId: In(scope.userIds) },
        order: { createdAt: 'DESC' },
      });
    }

    return {
      list: rows.map(toTaskImageHistoryRow),
    };
  }

  async update(id: number, dto: UpdateTaskImageHistoryDto, userId: string) {
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
