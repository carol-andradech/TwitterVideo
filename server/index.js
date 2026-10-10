import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { findVideo } from './video.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
const clientDirectory = fileURLToPath(new URL('../client/dist/', import.meta.url));

if (process.env.NODE_ENV === 'production' && !existsSync(`${clientDirectory}/index.html`)) {
  throw new Error('Interface não compilada. Execute npm run build na raiz antes de iniciar.');
}

// Converte o corpo JSON da requisição em um objeto disponível em req.body.
app.use(express.json({ limit: '10kb' }));

// Verifica o servidor sem consultar o X a cada checagem da hospedagem.
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// POST e GET compartilham a mesma busca, sem salvar o vídeo em disco.
async function sendClip(postId, res) {
  try {
    const video = await findVideo(postId);
    res.set('Cache-Control', 'no-store');
    return res.json({
      message: 'Vídeo encontrado! Aperte play para assistir.',
      postId,
      url: `https://x.com/i/status/${postId}`,
      video,
    });
  } catch (error) {
    if (!error.status) console.error(error);
    return res.status(error.status ?? 500).json({
      message: error.status ? error.message : 'O servidor encontrou um erro inesperado.',
    });
  }
}

app.get('/api/clips/:postId', (req, res) => {
  const { postId } = req.params;
  if (!/^[0-9]{1,20}$/.test(postId)) {
    return res.status(400).json({ message: 'O identificador do post é inválido.' });
  }
  return sendClip(postId, res);
});

app.post('/api/clips', async (req, res) => {
  const url = req.body?.url;
  if (typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ message: 'Informe a URL de um post.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return res.status(400).json({ message: 'URL inválida. Cole o link completo, incluindo https://.' });
  }

  const allowedHosts = ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'];
  if (parsedUrl.protocol !== 'https:' || !allowedHosts.includes(parsedUrl.hostname)
      || parsedUrl.username || parsedUrl.password || parsedUrl.port
      || !/^\/[a-zA-Z0-9_]+\/status\/[0-9]{1,20}\/?$/.test(parsedUrl.pathname)) {
    return res.status(400).json({ message: 'Use o link HTTPS de um post do X ou Twitter, no formato https://x.com/usuario/status/123456789.' });
  }

  const postId = parsedUrl.pathname.split('/')[3];
  return sendClip(postId, res);
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'O corpo da requisição precisa ser um JSON válido.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'A requisição é muito grande. Envie apenas a URL.' });
  }
  console.error(err);
  return res.status(500).json({ message: 'O servidor encontrou um erro inesperado.' });
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Rota da API não encontrada.' });
});

// O mesmo Node entrega a API e os arquivos compilados do React.
// Links /?clip=... também recebem index.html, pois a rota continua sendo /.
app.use(express.static(clientDirectory));
app.get('/', (req, res) => {
  res.status(503).type('text').send('Compile a interface com npm run build na raiz ou use o Vite durante o desenvolvimento.');
});

app.listen(port, host, () => {
  console.log(`zona de segurança: http://${host}:${port}`);
});
