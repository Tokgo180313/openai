/** 仅根据客户端 / DB 显式 type 字段映射（不含 payload 推断）。 */
export function normalizeExplicitInputType(
  rawType: unknown,
): 'input_text' | 'input_url' | 'input_file' {
  const source = String(rawType ?? '')
    .trim()
    .toLowerCase();
  if (source === 'input_url' || source === 'image') {
    return 'input_url';
  }
  if (source === 'input_file' || source === 'file') {
    return 'input_file';
  }
  return 'input_text';
}

/**
 * 结合显式 type 与字段推断最终类型；用于落库与列表展示，避免仅有图片字段却落成默认 input_text。
 */
export function inferUserContentInputType(
  item: Record<string, unknown>,
): 'input_text' | 'input_url' | 'input_file' {
  const explicit = normalizeExplicitInputType(item?.type);

  const openaiFileId = String(item?.openaiFileId ?? item?.file_id ?? '').trim();
  const gridFsId = String(item?.gridFsFileId ?? '').trim();

  if (explicit === 'input_file') {
    return 'input_file';
  }
  if (explicit === 'input_url') {
    return 'input_url';
  }

  if (openaiFileId || gridFsId) {
    return 'input_file';
  }

  const inputUrl = String(item?.input_url ?? '').trim();
  const imageB64 = String(item?.image_base64 ?? '').trim();
  const mime = String(item?.mimeType ?? '').trim().toLowerCase();
  if (inputUrl || imageB64 || mime.startsWith('image/')) {
    return 'input_url';
  }

  const fileUrl = String(item?.fileUrl ?? item?.file_url ?? '').trim();
  if (fileUrl && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileUrl)) {
    return 'input_url';
  }

  return 'input_text';
}
