import { execFile } from 'node:child_process';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const imageDir = path.join(root, 'public', 'images');
const outDir = path.join(imageDir, 'rack');
const converter = process.env.IMAGEMAGICK_BIN || 'convert';

/**
 * The rack shows each product as a narrow, full-length garment band. Catalogue
 * photos are lifestyle portraits, so for clothes and trousers we drop the top
 * quarter (the model's head) and keep the torso-and-legs band; objects
 * (bags, watches, glasses, accessories) are kept centred, since the product
 * itself sits in the middle of the frame.
 */
const JOBS = [
  { directory: 'clothing', gravity: 'south', width: '15%', height: '68%', offset: '0+0' },
  { directory: 'pants', gravity: 'south', width: '15%', height: '68%', offset: '0+0' },
  { directory: 'bag', gravity: 'center', width: '16%', height: '64%', offset: '0+0' },
  { directory: 'watch', gravity: 'center', width: '16%', height: '64%', offset: '0+0' },
  { directory: 'glasses', gravity: 'center', width: '16%', height: '64%', offset: '0+0' },
  { directory: 'accessory', gravity: 'center', width: '16%', height: '64%', offset: '0+0' },
];

const SLICE_WIDTH = 72;

async function main() {
  let count = 0;
  for (const job of JOBS) {
    const sourceDir = path.join(imageDir, job.directory);
    const targetDir = path.join(outDir, job.directory);
    await mkdir(targetDir, { recursive: true });

    let files = [];
    try {
      files = await readdir(sourceDir);
    } catch {
      continue;
    }

    for (const name of files.filter((file) => file.endsWith('.jpg')).sort()) {
      const source = path.join(sourceDir, name);
      const target = path.join(targetDir, name.replace(/\.jpg$/, '.webp'));
      await execFileAsync(converter, [
        source,
        '-auto-orient',
        '-strip',
        '-gravity',
        job.gravity,
        '-crop',
        `${job.width}x${job.height}+${job.offset}`,
        '+repage',
        '-resize',
        `${SLICE_WIDTH}x`,
        '-quality',
        '82',
        target,
      ]);
      count += 1;
    }
  }
  console.log(`generated ${count} rack slices in ${path.relative(root, outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
