/**
 * 图片生成相关接口（路径需与后端一致时可统一改此处）
 */
import request from "../reuquest";

export function fuseImagesApi(data: unknown, signal?: AbortSignal) {
  return request({
    url: "/image/fuse",
    method: "post",
    data,
    signal,
  });
}

export function generateImagesByPromptApi(data: unknown, signal?: AbortSignal) {
  return request({
    url: "/image/generateByPrompt",
    method: "post",
    data,
    signal,
  });
}

export function generateImagesByPromptV2Api(data: unknown, signal?: AbortSignal) {
  return request({
    url: "/image/generateByPromptV2",
    method: "post",
    data,
    signal,
  });
}

export function getImageTaskResultApi(data: unknown, signal?: AbortSignal) {
  return request({
    url: "/image/taskResult",
    method: "post",
    data,
    signal,
  });
}

export function linxfoxUploadByBase64Api(data: unknown, signal?: AbortSignal) {
  return request({
    url: "/image/uploadBase64",
    method: "post",
    data,
    signal,
  });
}

export function linkfoxGetImageApi(data: unknown, signal?: AbortSignal) {
  return request({
    url: "/image/linkfox/get",
    method: "post",
    data,
    signal,
  });
}

export function linkfoxGenerateApi(data: unknown, signal?: AbortSignal) {
  return request({
    url: "/image/linkfox/generate",
    method: "post",
    data,
    signal,
  });
}

export function qianwenImageApi(data: unknown, signal?: AbortSignal) {
  return request({
    url: "/image/qianwen",
    method: "post",
    data,
    signal,
  });
}

/** 对应后端 TaskImageGenerateDto；userId 由服务端解析，前端不传 */
export function taskImageGenerateApi(data: unknown, signal?: AbortSignal) {
  return request({
    url: "/taskImage/generateImage",
    method: "post",
    data,
    signal,
  });
}

/** 查询当前用户是否在使用的图片任务（无 query 参数） */
export function findTaskImageApi(signal?: AbortSignal) {
  return request({
    url: "/taskImage/findTaskImage",
    method: "get",
    signal,
  });
}

/** 按 taskId 查询图片任务是否已存在（GET，query：taskId；路径需与后端一致） */
export function findTaskImageByTaskIdApi(taskId: number | string, signal?: AbortSignal) {
  return request({
    url: "/taskImage/findTaskImageByTaskId",
    method: "get",
    params: { taskId },
    signal,
  });
}

/** 新增图片任务；body 与后端一致（如 taskId 等） */
export function addTaskImageApi(data?: Record<string, unknown>, signal?: AbortSignal) {
  return request({
    url: "/taskImage/addTaskImage",
    method: "post",
    data: data ?? {},
    signal,
  });
}

/** 多图上传至服务端本地目录；body 为 multipart FormData（字段名 files，与后端约定一致时可改） */
export function uploadImagesApi(formData: FormData, signal?: AbortSignal) {
  return request({
    url: "/file/uploadImages",
    method: "post",
    data: formData,
    signal,
    transformRequest: [
      (data, headers) => {
        if (data instanceof FormData) {
          delete (headers as Record<string, unknown>)["Content-Type"];
        }
        return data;
      },
    ],
  });
}

/** 更新任务参考图地址列表 */
export function updateTaskImageSourceImagesApi(
  param: { taskId: number | string; sourceImages: string[]; status?: number },
  signal?: AbortSignal,
) {
  return request({
    url: "/taskImage/updateSourceImages",
    method: "post",
    data: {
      taskId: param.taskId,
      sourceImages: param.sourceImages,
      status: param.status ?? 1,
    },
    signal,
  });
}

/** 按任务 ID 查询图片生成历史记录 */
export function taskImageHistoryByTaskIdApi(
  param: { taskId: number | string },
  signal?: AbortSignal,
) {
  return request({
    url: "/taskImage/historyByTaskId",
    method: "post",
    data: { taskId: param.taskId },
    signal,
  });
}

/** 分页查询当前用户图片任务历史（筛选：current、pageSize、status、modelName、roleId） */
export function taskImageHistoryRecordApi(
  data: {
    current: number;
    pageSize: number;
    status?: number;
    modelName?: string;
    roleId?: string | null;
  },
  signal?: AbortSignal,
) {
  return request({
    url: "/taskImage/history-record",
    method: "post",
    data,
    signal,
  });
}

/** 删除服务端本地参考图；DELETE，body 字段名与后端一致：locallocalPath */
export function deleteInputImageApi(
  param: { localPath: string },
  signal?: AbortSignal,
) {
  return request({
    url: "/file/inputImages",
    method: "delete",
    data: { locallocalPath: param.localPath },
    signal,
  });
}

/** 按服务端本地路径读取图片文件（GET query：localPath），返回 Blob */
export function fetchInputImageByLocalPathApi(localPath: string, signal?: AbortSignal) {
  return request({
    url: "/file/inputImages/by-local-path",
    method: "get",
    params: { localPath },
    responseType: "blob",
    signal,
  }) as Promise<Blob>;
}
