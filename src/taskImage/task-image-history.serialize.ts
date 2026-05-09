import { TaskImageHistory } from './entities/task-image-history.entity';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** 与示例一致的日期字符串 */
export function formatHistoryDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function toTaskImageHistoryRow(e: TaskImageHistory) {
  return {
    id: e.id,
    user_id: e.userId,
    task_id: e.taskId,
    model_name: e.modelName,
    input_text: e.inputText,
    source_images: e.sourceImages ?? [],
    result_images: e.resultImages ?? [],
    cover_image: e.coverImage ?? null,
    image_count: e.imageCount,
    aspect_ratio: e.aspectRatio ?? null,
    image_size: e.imageSize ?? null,
    status: e.status,
    cost: e.cost,
    created_at: formatHistoryDate(e.createdAt),
    updated_at: formatHistoryDate(e.updatedAt),
  };
}
