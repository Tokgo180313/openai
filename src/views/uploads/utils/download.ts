import api from "@/api/apiList";

const { buildUploadFileDownloadUrl } = api;

/** 带 JWT 下载/预览文件（后端 download 接口需鉴权） */
export async function downloadUploadFileWithAuth(
  fileId: number | string,
  fileName?: string,
): Promise<void> {
  const token = sessionStorage.getItem("access_token") || "";
  const url = buildUploadFileDownloadUrl(fileId);
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`下载失败 (${response.status})`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export async function previewUploadFileWithAuth(
  fileId: number | string,
): Promise<void> {
  const token = sessionStorage.getItem("access_token") || "";
  const url = buildUploadFileDownloadUrl(fileId);
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error(`预览失败 (${response.status})`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank");
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
