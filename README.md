# zona de segurança

Projeto de aprendizado com React e Node/Express para assistir a vídeos públicos do X.

## Rodar localmente

Use Node 22.17 ou uma versão mais recente da linha 22.
Na raiz, instale as dependências nas versões dos arquivos package-lock.json:

```sh
npm run install:all
```

Para desenvolver, use dois terminais:

```sh
npm --prefix server run dev
```

```sh
npm --prefix client run dev
```

Abra http://127.0.0.1:5173.

Para testar a aplicação compilada, sem Vite:

```sh
npm run build
npm start
```

Abra http://127.0.0.1:3001. Se o servidor de desenvolvimento estiver usando essa porta,
encerre-o com Ctrl+C primeiro. Execute `npm test` para testar o extrator.

## Publicar no Render

Envie este projeto para um repositório GitHub, incluindo os dois package-lock.json.
Não envie node_modules, dist ou arquivos .env (já estão no .gitignore).
No Render, conecte esse repositório em **New → Web Service** e configure:

| Campo | Valor |
| --- | --- |
| Language | Node |
| Root Directory | Deixar vazio (raiz do repositório) |
| Build Command | `npm run install:all && npm run build` |
| Start Command | `npm start` |
| Instance Type | Free |
| Environment variable | `NODE_ENV=production` |
| Health Check Path | `/api/health` |

O Render fornece PORT. O servidor usa 0.0.0.0 em produção e o package.json da raiz
seleciona a linha 22 do Node. Não é necessário banco de dados ou domínio próprio.

Depois da publicação, abra o endereço HTTPS fornecido pelo Render, busque um post
público com vídeo e abra o link gerado em outro navegador ou celular. Confirme também
que o vídeo carrega após atualizar a página. Esse teste remoto ainda precisa ser feito:
o X pode responder de forma diferente a requisições de uma hospedagem.

Documentação: https://render.com/docs/web-services e https://render.com/docs/free

## Estado atual e limites

- Busca experimental do primeiro MP4 público, player, colagem/limpeza e link por ID.
- O link consulta o X novamente; não salvamos vídeos nem usamos contas/cookies do X.
- Posts removidos, restritos ou não suportados podem falhar.
- No Render gratuito, o serviço dorme após 15 minutos sem tráfego; a próxima abertura
  pode levar cerca de um minuto. Há limites mensais de uso.
- Preparado para publicação; ainda não publicado. Próximo passo: GitHub e primeiro deploy.
