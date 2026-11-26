import assert from 'node:assert/strict';
import { mkdir, mkdtempDisposable, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { FastEmbedEmbedder } from './embedder.ts';

// The cache is fastembed's own store. Its model folder is left as the 2026-11-16 loss left the
// old one: the folder exists, but model_optimized.onnx and the tokenizer files are gone.
test('an embedder whose model folder lost its files downloads them again and embeds the query', async () => {
  await using root = await mkdtempDisposable(join(tmpdir(), 'memory-embedder-'));
  const cacheDir = join(root.path, 'fastembed');
  const modelDir = join(cacheDir, 'Qdrant_bge-small-en-v1.5-onnx-Q');
  await mkdir(modelDir, { recursive: true });
  await writeFile(join(modelDir, 'config.json'), '{"pad_token_id": 0}');

  const vector = await new FastEmbedEmbedder({ cacheDir }).embedQuery('how are tests written');

  assert.equal(vector.length, 384);
});
