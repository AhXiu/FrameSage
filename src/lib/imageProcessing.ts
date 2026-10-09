export const IMAGE_LIMITS = {
  maxBytes: 12 * 1024 * 1024,
  maxEdge: 1600,
  jpegQuality: 0.82,
} as const;

export interface ImageDimensions {
  width: number;
  height: number;
}

export function validateImageFile(
  file: Pick<File, 'type' | 'size'>,
  maxBytes = IMAGE_LIMITS.maxBytes,
): string | null {
  if (!file.type.startsWith('image/'))
    return '请选择 JPG、PNG、WebP 等图片文件。';
  if (file.size <= 0) return '图片内容为空，请重新选择。';
  if (file.size > maxBytes)
    return `图片不能超过 ${Math.round(maxBytes / 1024 / 1024)}MB，请选择较小文件。`;
  return null;
}

export function fitWithinMaxEdge(
  { width, height }: ImageDimensions,
  maxEdge = IMAGE_LIMITS.maxEdge,
): ImageDimensions {
  if (!(width > 0) || !(height > 0) || !(maxEdge > 0))
    throw new Error('图片尺寸无效。');
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function compressImage(
  file: File,
  limits = IMAGE_LIMITS,
): Promise<Blob> {
  const error = validateImageFile(file, limits.maxBytes);
  if (error) throw new Error(error);
  let source: ImageBitmap | HTMLImageElement | undefined;
  let fallbackUrl: string | undefined;
  try {
    if ('createImageBitmap' in window) {
      source = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      });
    } else {
      fallbackUrl = URL.createObjectURL(file);
      source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('无法读取图片，请换一张重试。'));
        image.src = fallbackUrl as string;
      });
    }
    const size = fitWithinMaxEdge(
      { width: source.width, height: source.height },
      limits.maxEdge,
    );
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('当前浏览器无法处理图片。');
    context.drawImage(source, 0, 0, size.width, size.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        blob =>
          blob ? resolve(blob) : reject(new Error('图片压缩失败，请重试。')),
        'image/jpeg',
        limits.jpegQuality,
      ),
    );
  } finally {
    if (fallbackUrl) URL.revokeObjectURL(fallbackUrl);
    if (source && 'close' in source) source.close();
  }
}
