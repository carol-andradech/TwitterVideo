// Endpoint de incorporação pública do X: experimental, sem garantia de estabilidade.
// Referência: https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/twitter.py
function videoError(status, message) {
  return Object.assign(new Error(message), { status });
}

function isMediaUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'video.twimg.com'
      && !url.username && !url.password && !url.port;
  } catch {
    return false;
  }
}

export async function findVideo(postId) {
  const endpoint = new URL('https://cdn.syndication.twimg.com/tweet-result');
  endpoint.searchParams.set('id', postId);
  // Parâmetro calculado pelo widget público; não é senha nem token de login.
  endpoint.searchParams.set('token', ((Number(postId) / 1e15) * Math.PI)
    .toString(36).replace(/(0+|\.)/g, ''));

  let post;
  try {
    const response = await fetch(endpoint, {
      signal: AbortSignal.timeout(15000),
      redirect: 'error',
    });
    if (response.status === 429) {
      throw videoError(503, 'O X limitou as consultas. Aguarde um pouco e tente novamente.');
    }
    if ([401, 403, 404].includes(response.status)) {
      throw videoError(404, 'Esse post não está disponível pela consulta pública. Não acessamos conteúdo que exige login.');
    }
    if (!response.ok) throw videoError(502, 'O X não conseguiu responder à consulta. Tente novamente mais tarde.');
    post = await response.json();
  } catch (error) {
    if (error.status) throw error;
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw videoError(504, 'A consulta ao X demorou demais. Tente novamente.');
    }
    console.error('Falha na consulta pública ao X:', error.message, error.cause?.code ?? '');
    throw videoError(502, 'Não foi possível consultar o X. Verifique a conexão do servidor e tente novamente.');
  }

  if (!post?.id_str) {
    throw videoError(404, 'O X não disponibilizou esse post. Ele pode estar removido, restrito ou indisponível para incorporação.');
  }
  if (post.id_str !== postId) throw videoError(502, 'O X retornou dados inesperados para esse link.');

  // Nesta etapa, usamos somente o primeiro vídeo anexado ao próprio post.
  const media = Array.isArray(post.mediaDetails)
    ? post.mediaDetails.find((item) => item?.type === 'video' || item?.type === 'animated_gif')
    : undefined;
  const variants = media?.video_info?.variants;
  const mp4 = (Array.isArray(variants) ? variants : [])
    .filter((variant) => variant?.content_type === 'video/mp4' && isMediaUrl(variant.url))
    .sort((a, b) => (Number(b.bitrate) || 0) - (Number(a.bitrate) || 0))[0];

  if (!mp4) {
    throw videoError(422, 'Não encontramos um MP4 público neste post. Ele pode não ter vídeo ou usar um formato ainda não suportado.');
  }

  return { url: mp4.url };
}
