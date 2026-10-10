import { useRef, useState } from "react";
import Watch from "./Watch.jsx";
import VideoPlayer from "./VideoPlayer.jsx";
import { readResponse, connectionMessage } from "./api.js";

export default function App() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [clip, setClip] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");
  const [isPasting, setIsPasting] = useState(false);
  const urlInput = useRef(null);
  const sharedPostId = new URLSearchParams(window.location.search).get("clip");
  const shareUrl = clip ? `${window.location.origin}/?clip=${clip.postId}` : "";

  async function pasteLink() {
    setIsPasting(true);
    setPasteMessage("");
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) setUrl(text);
      else
        setPasteMessage(
          "A área de transferência não contém texto. Copie um link primeiro.",
        );
    } catch {
      setPasteMessage(
        "O navegador não permitiu colar automaticamente. Use Ctrl+V ou a opção Colar do seu celular no campo.",
      );
    } finally {
      setIsPasting(false);
      urlInput.current?.focus();
    }
  }

  function clearLink() {
    setUrl("");
    setPasteMessage("");
    urlInput.current?.focus();
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("");
      setCopyMessage("Link copiado!");
    } catch {
      setCopyMessage(
        "Não foi possível copiar automaticamente. Selecione o link acima e copie manualmente.",
      );
    }
  }

  async function shareNative() {
    if (!shareUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "zona de segurança",
          text: "Veja esse vídeo comigo:",
          url: shareUrl,
        });
        setShareMessage("Compartilhado!");
        setCopyMessage("");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareMessage(
        "Compartilhamento nativo não disponível no navegador. Copiei o link para você.",
      );
      setCopyMessage("");
    } catch {
      setShareMessage(
        "Não foi possível abrir o compartilhamento. Copie o link ou use o WhatsApp.",
      );
    }
  }

  function shareWhatsApp() {
    if (!shareUrl) return;
    const message = encodeURIComponent(`Veja esse vídeo: ${shareUrl}`);
    window.open(
      `https://wa.me/?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
    setShareMessage("Abrindo o WhatsApp…");
    setCopyMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault(); // Envia com JavaScript, sem recarregar a página.
    setStatus("loading");
    setClip(null);
    setCopyMessage("");
    setMessage("Procurando um vídeo público no X…");

    try {
      const response = await fetch("/api/clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await readResponse(response);

      setStatus("success");
      setClip(data);
      setMessage(data.message);
    } catch (error) {
      setStatus("error");
      setMessage(connectionMessage(error));
    }
  }

  return (
    <main>
      <header className="hero">
        <p className="eyebrow">
          <span aria-hidden="true">♡</span> programa de proteção contra o
          twitter
        </p>
        <div className="flower" aria-hidden="true">
          <svg viewBox="0 0 100 100" fill="none">
            <g fill="#ffe9a0" stroke="#705775" strokeWidth="2">
              <ellipse cx="50" cy="26" rx="15" ry="23" />
              <ellipse cx="50" cy="74" rx="15" ry="23" />
              <ellipse cx="26" cy="50" rx="23" ry="15" />
              <ellipse cx="74" cy="50" rx="23" ry="15" />
              <circle cx="50" cy="50" r="20" fill="#f5b8c8" />
            </g>
            <path
              d="M43 46v3m14-3v3m-14 7q7 7 14 0"
              stroke="#705775"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1>
          zona de
          <br />
          <span>segurança</span>
          <i aria-hidden="true">✧</i>
        </h1>
        <p className="intro">
          {sharedPostId !== null ? (
            <>
              Está tudo bem, para proteger <strong>VOCÊ</strong> do ambiente
              infernal e tóxico que é o twitter, aqui está o vídeo que queria te
              mostrar, não precisa se preocupar, essa é uma área segura!
            </>
          ) : (
            <>
              Sabe aquela pessoa que não tem twitter mas para quem você uma vez
              ou outra quer compartilhar um vídeo? Aquela pessoa que só vai ver
              o conteúdo 2 semanas depois pelo bluesky. Aqui você compartilha o
              vídeoa para os ex-usuarios de twitter sem colocá-los no perigo
              real de interagir diretamente com a rede.
              <br />
              “vi isso e lembrei de você”.
            </>
          )}
        </p>
        <p className="little-note">
          {" "}
          veja veja <span aria-hidden="true">↴</span>
        </p>
      </header>

      {sharedPostId !== null ? (
        <Watch postId={sharedPostId} />
      ) : (
        <section aria-labelledby="form-title">
          <div className="card-heading">
            <span className="card-icon" aria-hidden="true">
              ♡
            </span>
            <div>
              <p className="card-kicker">olha issoooo</p>
              <h2 id="form-title">feito p meu mozinho</h2>
            </div>
          </div>
          <p className="form-intro">
            Cole um post Twitter e prepare um vídeo para compartilhar.
          </p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="post-url">URL do Twitter</label>
            <div className="url-row">
              <div className="url-field">
                <input
                  ref={urlInput}
                  id="post-url"
                  type="url"
                  required
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://x.com/usuario/status/123456789"
                  aria-describedby="paste-message step-note"
                  disabled={status === "loading"}
                />
                <button
                  className="clear-url"
                  type="button"
                  onClick={clearLink}
                  aria-label="Limpar URL"
                  title="Limpar URL"
                  disabled={!url || status === "loading" || isPasting}
                >
                  ×
                </button>
              </div>
              <button
                className="paste-url"
                type="button"
                onClick={pasteLink}
                disabled={status === "loading" || isPasting}
              >
                {isPasting ? "Colando…" : "Colar"}
              </button>
            </div>
            <p id="paste-message" className="paste-message" role="status">
              {pasteMessage}
            </p>
            <button type="submit" disabled={status === "loading" || isPasting}>
              {status === "loading" ? "Buscando…" : "Buscar vídeo"}
            </button>
          </form>
          <p className={`message ${status}`} role="status" aria-live="polite">
            {message}
          </p>
          {clip && (
            <>
              <div className="share-box">
                <label htmlFor="share-url">Link para compartilhar</label>
                <input
                  id="share-url"
                  value={shareUrl}
                  readOnly
                  onFocus={(event) => event.target.select()}
                />
                <div className="share-actions">
                  <button
                    className="share-primary"
                    type="button"
                    onClick={shareNative}
                  >
                    Compartilhar
                  </button>
                  <button
                    className="share-whatsapp"
                    type="button"
                    onClick={shareWhatsApp}
                  >
                    WhatsApp
                  </button>
                  <button
                    className="share-copy"
                    type="button"
                    onClick={copyLink}
                  >
                    Copiar link
                  </button>
                </div>
                <p role="status">{copyMessage || shareMessage}</p>
                <a href={shareUrl} target="_blank" rel="noreferrer">
                  Abrir página do vídeo ↗
                </a>
                {["127.0.0.1", "localhost", "[::1]"].includes(
                  window.location.hostname,
                ) && <p className="note"></p>}
              </div>
              <VideoPlayer
                clip={clip}
                onError={() => {
                  setStatus("error");
                  setMessage(
                    "Encontramos o endereço, mas o navegador não conseguiu carregar o vídeo. Tente buscar novamente ou abra o post original.",
                  );
                }}
              />
            </>
          )}
          <p id="step-note" className="note"></p>
        </section>
      )}
      <footer>
        <span aria-hidden="true">✿</span> bjks <span aria-hidden="true">♡</span>
      </footer>
    </main>
  );
}
