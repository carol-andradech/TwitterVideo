import { useEffect, useState } from "react";
import VideoPlayer from "./VideoPlayer.jsx";
import { readResponse, connectionMessage } from "./api.js";

export default function Watch({ postId }) {
  const [clip, setClip] = useState(null);
  const [message, setMessage] = useState("Buscando o vídeo compartilhado…");
  const [shareMessage, setShareMessage] = useState("");
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const validId = /^[0-9]{1,20}$/.test(postId);
  const shareUrl = `${window.location.origin}/?clip=${postId}`;

  async function shareNative() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "zona de segurança",
          text: "Veja esse vídeo comigo:",
          url: shareUrl,
        });
        setShareMessage("Compartilhado!");
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      setShareMessage(
        "Compartilhamento nativo não disponível no navegador. Copiei o link para você.",
      );
    } catch {
      setShareMessage(
        "Não foi possível abrir o compartilhamento. Copie o link ou use o WhatsApp.",
      );
    }
  }

  function shareWhatsApp() {
    const message = encodeURIComponent(`Veja esse vídeo: ${shareUrl}`);
    window.open(
      `https://wa.me/?text=${message}`,
      "_blank",
      "noopener,noreferrer",
    );
    setShareMessage("Abrindo o WhatsApp…");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage("Link copiado!");
    } catch {
      setShareMessage(
        "Não foi possível copiar automaticamente. Selecione o link acima e copie manualmente.",
      );
    }
  }

  useEffect(() => {
    if (!validId) {
      setStatus("error");
      setMessage(
        "Este link da zona de segurança é inválido. Confira se ele foi copiado por completo.",
      );
      return;
    }
    // Cancela a requisição quando o componente sai da tela ou inicia outra busca.
    const controller = new AbortController();
    setClip(null);
    setStatus("loading");
    setMessage("Buscando o vídeo compartilhado…");

    async function loadClip() {
      try {
        const response = await fetch(`/api/clips/${postId}`, {
          signal: controller.signal,
        });
        const data = await readResponse(response);
        if (controller.signal.aborted) return;
        setClip(data);
        setStatus("success");
        setMessage("Vídeo carregado com sucesso!");
      } catch (error) {
        if (controller.signal.aborted) return;
        setStatus("error");
        setMessage(connectionMessage(error));
      }
    }
    loadClip();
    return () => controller.abort();
  }, [postId, validId, attempt]);

  return (
    <section aria-labelledby="watch-title">
      <p className={`message ${status}`} role="status">
        {message}
      </p>
      {clip && (
        <>
          <VideoPlayer
            clip={clip}
            onError={() => {
              setStatus("error");
              setMessage(
                "Não foi possível reproduzir o vídeo. Tente buscar novamente ou abra o post original.",
              );
            }}
          />
          <div className="share-box">
            <label htmlFor="watch-share-url">Link para compartilhar</label>
            <input
              id="watch-share-url"
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
              <button className="share-copy" type="button" onClick={copyLink}>
                Copiar link
              </button>
            </div>
            <p role="status">{shareMessage}</p>
          </div>
        </>
      )}
      {status === "error" && validId && (
        <button onClick={() => setAttempt(attempt + 1)}>
          Tentar novamente
        </button>
      )}

      <a href="/">Compartilhar outro vídeo</a>
    </section>
  );
}
