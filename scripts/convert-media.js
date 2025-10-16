import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegStatic);

const PHOTOS_DIR = path.join(globalThis.process.cwd(), 'public', 'photos');
const IMAGE_SAFE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']);
const VIDEO_SAFE = new Set(['.mp4', '.webm', '.ogg']);

async function convertImage(inputPath, outBase) {
  const outWebp = `${outBase}.webp`;
  const outJpg = `${outBase}.jpg`;
  try {
    // Create WebP
    await sharp(inputPath)
      .rotate()
      .webp({ quality: 85 })
      .toFile(outWebp);
    // Create JPG fallback
    await sharp(inputPath)
      .rotate()
      .jpeg({ quality: 82 })
      .toFile(outJpg);
    return { webp: outWebp, jpg: outJpg };
  } catch (err) {
    console.error('Image conversion failed for', inputPath, err.message || err);
    return null;
  }
}

function convertVideo(inputPath, outBase) {
  const outMp4 = `${outBase}.mp4`;
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-c:a aac', '-b:a 128k'])
      .on('end', () => resolve({ mp4: outMp4 }))
      .on('error', (err) => reject(err))
      .save(outMp4);
  });
}

async function run() {
  try {
    const entries = await fs.readdir(PHOTOS_DIR);
    const files = entries.filter((f) => !f.startsWith('.'));
    if (!files.length) {
      console.log('No files found in', PHOTOS_DIR);
      return;
    }

    const summary = [];

    for (const file of files) {
      const full = path.join(PHOTOS_DIR, file);
      const stat = await fs.stat(full);
      if (!stat.isFile()) continue;

      const ext = path.extname(file).toLowerCase();
      const base = path.join(PHOTOS_DIR, path.basename(file, ext));

      if (IMAGE_SAFE.has(ext)) {
        summary.push({ file, action: 'skip (already web-safe image)' });
        continue;
      }

      if (VIDEO_SAFE.has(ext)) {
        summary.push({ file, action: 'skip (already web-safe video)' });
        continue;
      }

      if (ext === '.heic' || ext === '.heif') {
        const outWebp = `${base}.webp`;
        // skip if already exists
        try {
          await fs.access(outWebp);
          summary.push({ file, action: 'skip (webp exists)' });
          continue;
        } catch (err) { void err; }

        console.log('Converting image', file, '→', path.basename(outWebp));
        const res = await convertImage(full, base);
        if (res) summary.push({ file, action: 'converted', outputs: [path.basename(res.webp), path.basename(res.jpg)] });
        else summary.push({ file, action: 'failed' });
        continue;
      }

      if (ext === '.mov' || ext === '.avi' || ext === '.mkv' || ext === '.wmv') {
        const outMp4 = `${base}.mp4`;
        try {
          await fs.access(outMp4);
          summary.push({ file, action: 'skip (mp4 exists)' });
          continue;
        } catch (err) { void err; }

        console.log('Converting video', file, '→', path.basename(outMp4));
        try {
          const res = await convertVideo(full, base);
          summary.push({ file, action: 'converted', outputs: [path.basename(res.mp4)] });
        } catch (err) {
          console.error('Video conversion failed for', file, err.message || err);
          summary.push({ file, action: 'failed' });
        }
        continue;
      }

      // unknown file type: try image conversion as a best-effort
      try {
        console.log('Attempting to convert unknown file', file, 'as image to webp');
        const res = await convertImage(full, base);
        if (res) summary.push({ file, action: 'converted (best-effort)', outputs: [path.basename(res.webp), path.basename(res.jpg)] });
        else summary.push({ file, action: 'failed' });
      } catch (err) { console.error('Best-effort conversion failed for', file, err.message || err); summary.push({ file, action: 'failed' }); }
    }

    console.log('\nConversion summary:');
    summary.forEach((s) => console.log('-', s.file, '→', s.action, s.outputs ? s.outputs.join(', ') : ''));
    console.log('\nDone.');
    console.log('Tip: update your media list in src/WeddingSite.jsx to point to the converted .webp/.mp4 files for best browser support.');
  } catch (err) {
    console.error('Conversion script error:', err.message || err);
    globalThis.process.exitCode = 1;
  }
}

run();
