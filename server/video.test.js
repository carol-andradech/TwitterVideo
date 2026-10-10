import test from 'node:test';
import assert from 'node:assert/strict';
import { findVideo } from './video.js';

const postId = '2108746000386981895';
const low = 'https://video.twimg.com/example/low.mp4';
const high = 'https://video.twimg.com/example/high.mp4';

test('escolhe MP4 de maior bitrate e consulta somente o endpoint público', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.origin, 'https://cdn.syndication.twimg.com');
    assert.equal(url.searchParams.get('id'), postId);
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    return Response.json({ id_str: postId, mediaDetails: [{ type: 'video', video_info: { variants: [
      { content_type: 'video/mp4', url: low, bitrate: 100 },
      { content_type: 'video/mp4', url: high, bitrate: 200 },
      { content_type: 'video/mp4', url: 'https://example.com/unsafe.mp4', bitrate: 999 },
      { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/video.m3u8' },
    ] } }] });
  });
  assert.deepEqual(await findVideo(postId), { url: high });
});

for (const [name, body, status] of [
  ['post indisponível', {}, 404],
  ['post sem vídeo', { id_str: postId }, 422],
  ['resposta de outro post', { id_str: '123' }, 502],
  ['mídia em formato inesperado', { id_str: postId, mediaDetails: {} }, 422],
]) {
  test(name, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => Response.json(body));
    await assert.rejects(findVideo(postId), { status });
  });
}

for (const [upstream, expected] of [[403, 404], [429, 503], [500, 502]]) {
  test(`HTTP ${upstream} do X vira resposta ${expected}`, async (t) => {
    t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: upstream }));
    await assert.rejects(findVideo(postId), { status: expected });
  });
}

test('timeout não deixa a consulta pendurada', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('Timeout', 'TimeoutError'); });
  await assert.rejects(findVideo(postId), { status: 504 });
});
