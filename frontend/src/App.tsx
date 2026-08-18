import { useEffect, useState } from "react";
import { createShortUrl, getAllUrls } from "./services/api";
import LoginPage from "./LoginPage";
import "./App.css";

type URLItem = {
  id: number;
  original_url: string;
  short_code: string;
  short_url: string;
  click_count: number;
  created_at: string;
};

type User = {
  id: number;
  email: string;
  name: string | null;
  profile_picture: string | null;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name[0].toUpperCase();
  }
  return email[0].toUpperCase();
}

function App() {
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setUrls([]);
  };

  async function loadUrls() {
    try {
      setError("");
      const data = await getAllUrls();
      setUrls(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load URLs. Please try again.");
    }
  }

  async function handleShorten() {
    if (!url.trim()) return;

    try {
      setLoading(true);
      setError("");
      await createShortUrl(url);
      setUrl("");
      await loadUrls();
    } catch (err) {
      console.error(err);
      setError("Failed to shorten URL. Please check the link and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !loading) {
      handleShorten();
    }
  }

  useEffect(() => {
    if (token) {
      loadUrls();
    }
  }, [token]);

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* ── TOP BAR ── */}
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="logo-mark">SC</div>
          <span className="logo-text">ShortCut</span>
        </div>

        <div className="top-bar-right">
          {user && (
            <div className="user-info-bar">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.name || "User"}
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-placeholder">
                  {getInitials(user.name, user.email)}
                </div>
              )}
              <div>
                <div className="user-name-bar">{user.name || "User"}</div>
                <div className="user-email-bar">{user.email}</div>
              </div>
            </div>
          )}
          <button className="btn-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="main-content">
        <section className="shortener-section">
          <label className="shortener-label">Shorten a new link</label>
          <div className="shortener-box">
            <input
              className="shortener-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://example.com/your-long-url"
            />
            <button
              className="btn-shorten"
              onClick={handleShorten}
              disabled={loading || !url.trim()}
            >
              {loading ? "Shortening…" : "Shorten"}
            </button>
          </div>
          {error && <div className="error-msg">{error}</div>}
        </section>

        <section>
          <div className="urls-header">
            <span className="urls-title">Your links</span>
            {urls.length > 0 && (
              <span className="urls-count">{urls.length} link{urls.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {urls.length === 0 ? (
            <div className="urls-empty">
              <div className="urls-empty-icon">🔗</div>
              <p>No links yet. Shorten your first URL above.</p>
            </div>
          ) : (
            <div className="url-list">
              {urls.map((item) => (
                <div className="url-card" key={item.id}>
                  <div className="url-card-top">
                    <span className="url-original">{item.original_url}</span>
                    <span className="url-date">{formatDate(item.created_at)}</span>
                  </div>
                  <div className="url-card-bottom">
                    <a
                      className="url-short-link"
                      href={item.short_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.short_url}
                    </a>
                    <span className="url-clicks">
                      <span className="click-dot" />
                      {item.click_count} click{item.click_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;