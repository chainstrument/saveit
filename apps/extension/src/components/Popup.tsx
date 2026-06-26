import { useEffect, useState } from "react";

export function Popup() {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) setUrl(tab.url);
      if (tab?.title) setTitle(tab.title);
    });
  }, []);

  async function handleSave() {
    setStatus("saving");
    try {
      const tagNames = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`${import.meta.env.WXT_API_URL}/api/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, title, note, tagNames }),
      });

      if (!res.ok) throw new Error("Erreur serveur");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div style={{ padding: 16, width: 320, fontFamily: "system-ui" }}>
        <p style={{ color: "green", fontWeight: "bold" }}>✓ Marque-page sauvegardé !</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, width: 320, fontFamily: "system-ui", display: "flex", flexDirection: "column", gap: 8 }}>
      <h2 style={{ margin: 0, fontSize: 16 }}>SaveIt</h2>

      <label style={{ fontSize: 12, color: "#555" }}>URL</label>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc", fontSize: 13 }}
      />

      <label style={{ fontSize: 12, color: "#555" }}>Titre</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc", fontSize: 13 }}
      />

      <label style={{ fontSize: 12, color: "#555" }}>Note</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Pourquoi tu sauvegardes cette page..."
        style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc", fontSize: 13, resize: "vertical" }}
      />

      <label style={{ fontSize: 12, color: "#555" }}>Tags (séparés par des virgules)</label>
      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="ex: IA, veille, outils"
        style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc", fontSize: 13 }}
      />

      {status === "error" && (
        <p style={{ color: "red", fontSize: 12, margin: 0 }}>Erreur lors de la sauvegarde.</p>
      )}

      <button
        onClick={handleSave}
        disabled={status === "saving"}
        style={{
          marginTop: 4,
          padding: "8px 16px",
          background: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: "bold",
          fontSize: 14,
        }}
      >
        {status === "saving" ? "Sauvegarde..." : "Sauvegarder cette page"}
      </button>
    </div>
  );
}
