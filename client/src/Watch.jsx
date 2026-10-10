import { useEffect, useState } from "react";
import VideoPlayer from "./VideoPlayer.jsx";
import { readResponse, connectionMessage } from "./api.js";

export default function Watch({ postId }) {
  const [clip, setClip] = useState(null);
  const [message, setMessage] = useState("Buscando o vídeo compartilhado…");
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const validId = /^[0-9]{1,20}$/.test(postId);

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
        setMessage("Aperte play para assistir.");
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
        <VideoPlayer
          clip={clip}
          onError={() => {
            setStatus("error");
            setMessage(
              "Não foi possível reproduzir o vídeo. Tente buscar novamente ou abra o post original.",
            );
          }}
        />
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
