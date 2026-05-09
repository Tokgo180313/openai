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
