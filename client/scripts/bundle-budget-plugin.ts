import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

const BYTES_PER_KIBIBYTE = 1024;
const MAX_INITIAL_GZIP_BYTES = 275 * BYTES_PER_KIBIBYTE;
const MAX_CHUNK_GZIP_BYTES = 375 * BYTES_PER_KIBIBYTE;
const MAX_CHUNK_RAW_BYTES = 1_300_000;
const MAX_TOTAL_GZIP_BYTES = 1024 * BYTES_PER_KIBIBYTE;

const formatKibibytes = (bytes: number): string =>
  `${(bytes / BYTES_PER_KIBIBYTE).toFixed(1)} KiB`;

export const bundleBudgetPlugin = (): Plugin => ({
  name: 'noasterisk:bundle-budget',
  apply: 'build',
  generateBundle: (_, bundle): void => {
    const chunks = Object.values(bundle).filter(
      (output) => output.type === 'chunk',
    );
    const chunksByFileName = new Map(
      chunks.map((chunk) => [chunk.fileName, chunk]),
    );
    const gzipBytesByFileName = new Map(
      chunks.map((chunk) => [chunk.fileName, gzipSync(chunk.code).byteLength]),
    );
    const initialFileNames = new Set<string>();

    const includeStaticImports = (fileName: string): void => {
      if (initialFileNames.has(fileName)) return;
      const chunk = chunksByFileName.get(fileName);
      if (chunk === undefined) return;
      initialFileNames.add(fileName);
      chunk.imports.forEach(includeStaticImports);
    };

    chunks
      .filter((chunk) => chunk.isEntry)
      .forEach((chunk) => {
        includeStaticImports(chunk.fileName);
      });

    const initialGzipBytes = [...initialFileNames].reduce(
      (total, fileName) => total + (gzipBytesByFileName.get(fileName) ?? 0),
      0,
    );
    const totalGzipBytes = [...gzipBytesByFileName.values()].reduce(
      (total, bytes) => total + bytes,
      0,
    );
    const largestRawChunk = chunks.reduce((largest, chunk) =>
      chunk.code.length > largest.code.length ? chunk : largest,
    );
    const largestGzipChunk = chunks.reduce((largest, chunk) =>
      (gzipBytesByFileName.get(chunk.fileName) ?? 0) >
      (gzipBytesByFileName.get(largest.fileName) ?? 0)
        ? chunk
        : largest,
    );
    const largestGzipBytes =
      gzipBytesByFileName.get(largestGzipChunk.fileName) ?? 0;

    const violations: string[] = [];
    if (initialGzipBytes > MAX_INITIAL_GZIP_BYTES) {
      violations.push(
        `initial graph ${formatKibibytes(initialGzipBytes)} exceeds ${formatKibibytes(MAX_INITIAL_GZIP_BYTES)}`,
      );
    }
    if (largestGzipBytes > MAX_CHUNK_GZIP_BYTES) {
      violations.push(
        `${largestGzipChunk.fileName} gzip ${formatKibibytes(largestGzipBytes)} exceeds ${formatKibibytes(MAX_CHUNK_GZIP_BYTES)}`,
      );
    }
    if (largestRawChunk.code.length > MAX_CHUNK_RAW_BYTES) {
      violations.push(
        `${largestRawChunk.fileName} raw ${formatKibibytes(largestRawChunk.code.length)} exceeds ${formatKibibytes(MAX_CHUNK_RAW_BYTES)}`,
      );
    }
    if (totalGzipBytes > MAX_TOTAL_GZIP_BYTES) {
      violations.push(
        `total JavaScript ${formatKibibytes(totalGzipBytes)} exceeds ${formatKibibytes(MAX_TOTAL_GZIP_BYTES)}`,
      );
    }

    if (violations.length > 0) {
      throw new Error(`Bundle budget exceeded:\n- ${violations.join('\n- ')}`);
    }

    console.info(
      `[bundle-budget] initial ${formatKibibytes(initialGzipBytes)}, largest gzip ${formatKibibytes(largestGzipBytes)}, largest raw ${formatKibibytes(largestRawChunk.code.length)}, total ${formatKibibytes(totalGzipBytes)}`,
    );
  },
});
