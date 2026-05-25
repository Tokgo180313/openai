import request from "../reuquest";
import type {
  UploadFileQueryDto,
  UploadFileUpdateDto,
} from "@/types/upload-file.type";

const prefix = "/upload-file";

/** 上传并暂存：POST /upload-file/save，multipart 字段 file */
export function saveUploadFileApi(
  formData: FormData,
  signal?: AbortSignal,
) {
  return request({
    url: `${prefix}/save`,
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

export function findUploadFileListApi(dto: UploadFileQueryDto) {
  return request({
    url: `${prefix}/findList`,
    method: "post",
    data: dto,
  });
}

export function findUploadFileByIdApi(id: number | string) {
  return request({
    url: `${prefix}/findById`,
    method: "get",
    params: { id },
  });
}

export function deleteUploadFileByIdApi(id: number | string) {
  return request({
    url: `${prefix}/deleteById`,
    method: "delete",
    params: { id },
  });
}

export function updateUploadFileApi(dto: UploadFileUpdateDto) {
  return request({
    url: `${prefix}/update`,
    method: "put",
    data: dto,
  });
}

export function markUploadFileUsedApi(id: number | string) {
  return request({
    url: `${prefix}/markUsed`,
    method: "put",
    params: { id },
  });
}

/** 带鉴权的下载地址（与后端 buildPublicUrl / download 路由一致） */
const buildUploadFileDownloadUrl = (fileId: number | string): string => {
  const base = String(import.meta.env.VITE_APP_BASIC_URL ?? "").replace(
    /\/$/,
    "",
  );
  return `${base}${prefix}/${fileId}/download`;
};

export default {
  saveUploadFileApi,
  findUploadFileListApi,
  findUploadFileByIdApi,
  updateUploadFileApi,
  deleteUploadFileByIdApi,
  markUploadFileUsedApi,
  buildUploadFileDownloadUrl,
};
