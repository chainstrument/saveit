import { useEffect, useState } from "react";

const API_URL = import.meta.env.WXT_API_URL ?? "http://localhost:3000";

type AuthState = "loading" | "authenticated" | "unauthenticated";
type SaveState = "idle" | "saving" | "success" | "error";

async function captureScreenshot(): Promise<string | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.windowId) return null;
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "jpeg", quality: 70 });
    if (!dataUrl) return null;
    return await new Promise<string | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 225;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, 400, 225);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  } catch {
    return null;
  }
}

function getToken(): Promise<string | null> {
  return new Promise<string | null>((resolve) => chrome.storage.local.get(["token"], (r) => resolve((r.token as string) ?? null)));
}
function saveToken(token: string): Promise<void> {
  return new Promise<void>((resolve) => chrome.storage.local.set({ token }, resolve));
}
function clearToken(): Promise<void> {
  return new Promise<void>((resolve) => chrome.storage.local.remove(["token"], resolve));
}

export function Popup() {
  const [auth, setAuth] = useState<AuthState>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [alreadySaved, setAlreadySaved] = useState(false);
  const [networkError, setNetworkError] = useState(false);

  // Login form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) setUrl(tab.url);
      if (tab?.title) setTitle(tab.title);
    });

    getToken().then(async (stored) => {
      if (!stored) { setAuth("unauthenticated"); return; }
      try {
        const res = await fetch(`${API_URL}/api/auth/get-session`, {
          headers: { Authorization: `Bearer ${stored}` },
          signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        if (data?.user) {
          setToken(stored);
          setAuth("authenticated");
          // Vérifier si la page courante est déjà sauvegardée
          chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const currentUrl = tabs[0]?.url;
            if (!currentUrl) return;
            try {
              const check = await fetch(`${API_URL}/api/bookmarks?url=${encodeURIComponent(currentUrl)}`, {
                headers: { Authorization: `Bearer ${stored}` },
                signal: AbortSignal.timeout(5000),
              });
              const existing = await check.json();
              if (Array.isArray(existing) && existing.length > 0) setAlreadySaved(true);
            } catch { /* non bloquant */ }
          });
        } else {
          await clearToken();
          setAuth("unauthenticated");
        }
      } catch (e) {
        if (e instanceof TypeError) setNetworkError(true);
        setAuth("unauthenticated");
      }
    });
  }, []);

  async function handleLogin(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Identifiants incorrects");
      if (!data.token) throw new Error("Token manquant dans la réponse");
      await saveToken(data.token);
      setToken(data.token);
      setAuth("authenticated");
    } catch (e) {
      if (e instanceof TypeError) setLoginError("Serveur inaccessible. Vérifiez que la webapp tourne.");
      else setLoginError(e instanceof Error ? e.message : "Erreur de connexion");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleSave() {
    setSaveState("saving");
    setErrorMsg("");
    try {
      const tagNames = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const screenshot = await captureScreenshot();
      const res = await fetch(`${API_URL}/api/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url, title, note: note || undefined, tagNames, screenshot: screenshot ?? undefined }),
      });
      if (res.status === 401) { await clearToken(); setAuth("unauthenticated"); return; }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setSaveState("success");
      setAlreadySaved(true);
    } catch (e) {
      if (e instanceof TypeError) setErrorMsg("Serveur inaccessible. Vérifiez que la webapp tourne.");
      else setErrorMsg(e instanceof Error ? e.message : "Erreur inconnue");
      setSaveState("error");
    }
  }

  if (auth === "loading") {
    return <Shell><p style={styles.muted}>Chargement...</p></Shell>;
  }

  if (networkError) {
    return (
      <Shell>
        <p style={{ ...styles.muted, color: "#dc2626" }}>Serveur inaccessible.</p>
        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>Vérifiez que la webapp tourne sur {API_URL}</p>
      </Shell>
    );
  }

  if (auth === "unauthenticated") {
    return (
      <Shell>
        <h2 style={styles.heading}>SaveIt</h2>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={styles.input}
              placeholder="vous@exemple.com"
            />
          </Field>
          <Field label="Mot de passe">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={styles.input}
              placeholder="••••••••"
            />
          </Field>
          {loginError && <p style={{ color: "#dc2626", fontSize: 12, margin: 0 }}>{loginError}</p>}
          <button type="submit" disabled={loggingIn} style={{ ...styles.btn, marginTop: 4 }}>
            {loggingIn ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </Shell>
    );
  }

  if (saveState === "success") {
    return (
      <Shell>
        <p style={{ ...styles.muted, color: "#16a34a", fontWeight: 600 }}>
          ✓ Marque-page sauvegardé !
        </p>
        <button onClick={() => { setSaveState("idle"); setNote(""); setTags(""); }} style={styles.btnOutline}>
          Sauvegarder une autre page
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={styles.heading}>SaveIt</h2>
        {alreadySaved && (
          <span style={{ fontSize: 11, background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>
            Déjà sauvegardé
          </span>
        )}
      </div>

      <Field label="URL">
        <input value={url} onChange={(e) => setUrl(e.target.value)} style={styles.input} />
      </Field>

      <Field label="Titre">
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />
      </Field>

      <Field label="Note">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Pourquoi tu sauvegardes cette page..."
          style={{ ...styles.input, resize: "vertical" }}
        />
      </Field>

      <Field label="Tags (séparés par des virgules)">
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="ex: IA, veille, outils"
          style={styles.input}
        />
      </Field>

      {saveState === "error" && (
        <p style={{ color: "#dc2626", fontSize: 12, margin: 0 }}>{errorMsg}</p>
      )}

      <button onClick={handleSave} disabled={saveState === "saving"} style={styles.btn}>
        {saveState === "saving" ? "Sauvegarde..." : "Sauvegarder cette page"}
      </button>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 16, width: 320, fontFamily: "system-ui", display: "flex", flexDirection: "column", gap: 10 }}>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

const styles = {
  heading: { margin: 0, fontSize: 16, fontWeight: 600 } as React.CSSProperties,
  label: { fontSize: 12, color: "#555" } as React.CSSProperties,
  muted: { fontSize: 13, color: "#666", margin: 0 } as React.CSSProperties,
  input: { padding: "6px 8px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13, width: "100%", boxSizing: "border-box" } as React.CSSProperties,
  btn: { marginTop: 4, padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14 } as React.CSSProperties,
  btnOutline: { marginTop: 4, padding: "8px 16px", background: "white", color: "#2563eb", border: "1px solid #2563eb", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14 } as React.CSSProperties,
};
