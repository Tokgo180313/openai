import { TaskImageDocument } from 'src/schemas/task-image/task-image.schema';
import { TaskImageHistory } from './entities/task-image-history.entity';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** 与示例一致的日期字符串 */
export function formatHistoryDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** Mongo task_image 集合文档，字段形状与历史表接口对齐（JSON 驼峰） */
export function toTaskImageMongoRow(doc: TaskImageDocument) {
  return {
    id: String(doc._id),
    userId: doc.userId,
    taskId: doc.taskId,
    modelName: doc.modelName ?? null,
    inputText: doc.inputText,
    prompt: doc.prompt ?? null,
    sourceImages: doc.sourceImages ?? [],
    resultImages: doc.resultImages ?? [],
    coverImage: doc.coverImage ?? null,
    imageCount: doc.imageCount,
    aspectRatio: doc.aspectRatio ?? null,
    imageSize: doc.imageSize ?? null,
    provider: doc.provider ?? null,
    status: doc.status,
    cost: doc.cost,
    createdAt: formatHistoryDate(doc.get('createdAt') as Date),
    updatedAt: formatHistoryDate(doc.get('updatedAt') as Date),
  };
}

export function toTaskImageHistoryRow(e: TaskImageHistory) {
  return {
    id: e.id,
    userId: e.userId,
    taskId: e.taskId,
    modelName: e.modelName,
    inputText: e.inputText,
    prompt: e.prompt ?? null,
    sourceImages: e.sourceImages ?? [],
    resultImages: e.resultImages ?? [],
    coverImage: e.coverImage ?? null,
    imageCount: e.imageCount,
    aspectRatio: e.aspectRatio ?? null,
    imageSize: e.imageSize ?? null,
    roleId: e.roleId ?? null,
    status: e.status,
    cost: e.cost,
    createdAt: formatHistoryDate(e.createdAt),
    updatedAt: formatHistoryDate(e.updatedAt),
  };
}
