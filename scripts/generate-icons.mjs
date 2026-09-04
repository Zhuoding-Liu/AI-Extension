import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const table = new Uint32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  table[n] = c >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const output = Buffer.alloc(data.length + 12);
  output.writeUInt32BE(data.length, 0);
  name.copy(output, 4);
  data.copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8);
  return output;
}

function insideRoundedRect(x, y, left, top, right, bottom, radius) {
  const cx = Math.max(left + radius, Math.min(right - radius, x));
  const cy = Math.max(top + radius, Math.min(bottom - radius, y));
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function colorAt(x, y) {
  if (!insideRoundedRect(x, y, 0, 0, 128, 128, 34)) return [0, 0, 0, 0];
  const t = Math.max(0, Math.min(1, (x + y - 20) / 196));
  let color = [167 - 74 * t, 140 - 81 * t, 255 - 44 * t, 255];

  const bars = [[35, 38, 93, 38], [35, 55, 73, 55], [35, 72, 84, 72], [35, 89, 64, 89]];
  if (bars.some(([x1, y1, x2, y2]) => distanceToSegment(x, y, x1, y1, x2, y2) <= 5)) color = [255, 255, 255, 255];

  if (Math.hypot(x - 94, y - 88) <= 13) color = [31, 29, 43, 245];
  if (distanceToSegment(x, y, 94, 81, 94, 95) <= 2 || distanceToSegment(x, y, 87, 88, 101, 88) <= 2) color = [255, 255, 255, 255];
  return color;
}

function makePng(size) {
  const scale = 128 / size;
  const samples = size < 64 ? 4 : 2;
  const raw = Buffer.alloc((size * 4 + 1) * size);

  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const total = [0, 0, 0, 0];
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const color = colorAt((x + (sx + 0.5) / samples) * scale, (y + (sy + 0.5) / samples) * scale);
          color.forEach((value, index) => { total[index] += value; });
        }
      }
      const offset = row + 1 + x * 4;
      total.forEach((value, index) => { raw[offset + index] = Math.round(value / (samples * samples)); });
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(new URL(`../icons/icon-${size}.png`, import.meta.url), makePng(size));
}
