import { createHash } from 'crypto';
import { extname } from 'node:path';
import type { UploadFileType } from '../enums/upload-file-type.enum';

export function sha256Hex(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function normalizeExt(fileName: string, mimeType: string): string {
  const fromName = extname(fileName).replace(/^\./, '').toLowerCase();
  if (fromName) return fromName;
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
  };
  return map[mimeType.toLowerCase()] ?? 'bin';
}

export function inferFileType(mimeType: string): UploadFileType {
  const m = mimeType.toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('audio/')) return 'audio';
  if (m.startsWith('video/')) return 'video';
  return 'file';
}

/** 从 PNG/JPEG 缓冲区解析宽高（失败返回 null） */
export function readImageDimensions(
  buffer: Buffer,
  mimeType: string,
): { width: number; height: number } | null {
  const m = mimeType.toLowerCase();
  if (m === 'image/png' && buffer.length >= 24) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
  }
  if (m === 'image/jpeg' || m === 'image/jpg') {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const len = buffer.readUInt16BE(offset + 2);
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) return { width, height };
        break;
      }
      offset += 2 + len;
    }
  }
  return null;
}
