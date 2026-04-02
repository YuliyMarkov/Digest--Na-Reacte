function ReelsModal({ isOpen, videoUrl, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "-40px",
            right: "0",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "22px",
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <div
          style={{
            width: "min(420px, calc(100vw - 32px))",
            aspectRatio: "9 / 16",
            background: "#000",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <iframe
            src={videoUrl}
            title="Instagram Reel"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share;"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
              background: "#000",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ReelsModal;
