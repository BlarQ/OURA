import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;
let loadPromise: Promise<FFmpeg> | null = null;

/**
 * Singleton loader for FFmpeg.wasm with remote unpkg core binaries.
 */
async function getFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const ffmpeg = new FFmpeg();

    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        // progress is 0 to 1
        onProgress(Math.min(Math.round(progress * 100), 99));
      });
    }

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegInstance = ffmpeg;
      isLoaded = true;
      return ffmpeg;
    } catch (err) {
      console.warn('FFmpeg WebAssembly load warning:', err);
      throw err;
    }
  })();

  return loadPromise;
}

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: string;
  name: string;
}

/**
 * Compresses a video client-side using FFmpeg.wasm (scales to max 720p with optimized CRF).
 * If FFmpeg fails (e.g. unsupported browser or missing SharedArrayBuffer), safely falls back
 * to the original file blob so the upload never gets blocked.
 */
export async function compressVideoClient(
  file: File,
  onProgress?: (percent: number, statusText: string) => void
): Promise<CompressionResult> {
  const originalSize = file.size;
  const originalName = file.name.replace(/\.[^/.]+$/, '');
  const outputFileName = `${originalName}_compressed.mp4`;

  onProgress?.(5, 'Initializing FFmpeg engine...');

  try {
    const ffmpeg = await getFFmpeg((pct) => {
      onProgress?.(10 + Math.round(pct * 0.75), `Compressing video (${pct}%)...`);
    });

    onProgress?.(15, 'Reading video data...');
    const inputExt = file.name.split('.').pop() || 'mp4';
    const inputName = `input_${Date.now()}.${inputExt}`;
    const outputName = `output_${Date.now()}.mp4`;

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    onProgress?.(25, 'Encoding video to 720p H.264...');

    // Run FFmpeg command: scale height to max 720p (maintaining aspect ratio), CRF 28 for high quality compression
    await ffmpeg.exec([
      '-i',
      inputName,
      '-vf',
      'scale=-2:min(720\\,ih)',
      '-c:v',
      'libx264',
      '-crf',
      '28',
      '-preset',
      'ultrafast',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      outputName,
    ]);

    onProgress?.(90, 'Finalizing compressed video...');
    const outputData = await ffmpeg.readFile(outputName);
    
    // Clean up virtual filesystem
    try {
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);
    } catch {}

    const outputBytes = outputData instanceof Uint8Array ? outputData : new Uint8Array(outputData as any);
    const arrayBuffer = outputBytes.buffer.slice(
      outputBytes.byteOffset,
      outputBytes.byteOffset + outputBytes.byteLength
    );
    const compressedBlob = new Blob([arrayBuffer as any], { type: 'video/mp4' });
    const compressedSize = compressedBlob.size;
    const savings = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

    onProgress?.(100, `Compression complete (${savings}% smaller)`);

    return {
      blob: compressedBlob,
      originalSize,
      compressedSize,
      compressionRatio: `${savings}% reduction`,
      name: outputFileName,
    };
  } catch (err) {
    console.warn('FFmpeg compression fallback to original video file:', err);
    onProgress?.(100, 'Using original video file (client compression bypassed)');
    return {
      blob: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 'Original quality',
      name: file.name,
    };
  }
}
