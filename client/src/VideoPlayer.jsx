export default function VideoPlayer({ clip, onError }) {
  return (
    <div className="video-result">
      <video
        key={clip.video.url}
        src={clip.video.url}
        controls
        playsInline
        preload="metadata"
        aria-label="Vídeo do post"
        onError={onError}
      >
        Seu navegador não suporta este player de vídeo.
      </video>
      <a href={clip.url} target="_blank" rel="noreferrer">
        Abrir post do Twitter ↗
      </a>
    </div>
  );
}
