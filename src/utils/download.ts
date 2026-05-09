/** 通过 fetch 拉取地址或 data URL 后触发浏览器下载 */
export async function downloadImage(src: string, filename: string) {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    const a = document.createElement("a");
    a.href = src;
    a.download = filename;
    a.click();
  }
}
