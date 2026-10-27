/** Dependency-free ZIP writer (stored entries). Browser-side batch exports
 * need one download, with filenames and media preserved as separate entries. */
type ZipEntry = { name: string; data: Uint8Array };

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function createZip(entries: readonly ZipEntry[]): Blob {
  if (entries.length > 65535) throw new Error("Too many diagrams for one ZIP archive.");
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  const central: BlobPart[] = [];
  let offset = 0;
  let centralSize = 0;
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    if (name.length > 65535) throw new Error("Diagram filename is too long.");
    const size = entry.data.length;
    if (size > 0xffffffff || offset > 0xffffffff) throw new Error("Diagram archive exceeds ZIP limits.");
    const crc = crc32(entry.data);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // UTF-8 names
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    parts.push(local.buffer, entry.data.slice().buffer);
    const center = new Uint8Array(46 + name.length);
    const cv = new DataView(center.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    center.set(name, 46);
    central.push(center.buffer);
    offset += local.length + size;
    centralSize += center.length;
  }
  if (offset + centralSize > 0xffffffff) throw new Error("Diagram archive exceeds ZIP limits.");
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, entries.length, true);
  view.setUint16(10, entries.length, true);
  view.setUint32(12, centralSize, true);
  view.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}
