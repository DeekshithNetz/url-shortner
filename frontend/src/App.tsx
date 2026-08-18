import { useEffect, useState, useCallback } from "react";
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

function App() {
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setUrls([]);
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const copyToClipboard = async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Failed to copy");
    }
  };

  const loadUrls = useCallback(async () => {
    try {
      setError("");
      setLoadingUrls(true);
      const data = await getAllUrls();
      setUrls(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load URLs");
    } finally {
      setLoadingUrls(false);
    }
  }, []);

  const handleShorten = async () => {
    if (!url.trim()) return;
    try {
      setLoading(true);
      setError("");
      await createShortUrl(url);
      setUrl("");
      await loadUrls();
      showToast("Link shortened successfully");
    } catch (err) {
      console.error(err);
      setError("Failed to shorten URL. Please check the format.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleShorten();
  };

  useEffect(() => {
    if (token) loadUrls();
  }, [token, loadUrls]);

  const totalClicks = urls.reduce((sum, u) => sum + u.click_count, 0);
  const todayLinks = urls.filter((u) => {
    const today = new Date().toDateString();
    return new Date(u.created_at).toDateString() === today;
  }).length;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const truncateUrl = (u: string, max = 48) =>
    u.length <= max ? u : u.substring(0, max) + "...";

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {toast && <div className="toast">{toast}</div>}

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <svg
              width="26"
              height="26"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M11.5 7L5 13.5L11.5 20"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 7L23 13.5L16.5 20"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="14"
                y1="5"
                x2="14"
                y2="22"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.3"
              />
            </svg>
            <span>Snip</span>
          </div>

          {user && (
            <div className="user-section">
              <div className="user-info">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name || "User"}
                    className="avatar"
                  />
                ) : (
                  <div className="avatar avatar-fallback">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="user-text">
                  <span className="user-name">{user.name || "User"}</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
              <button className="btn-logout" onClick={handleLogout}>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main">
        {/* Hero / Input */}
        <section className="input-section">
          <div className="input-section-inner">
            <h1 className="hero-title">
              Shorten. Share. <span className="accent">Track.</span>
            </h1>
            <p className="hero-subtitle">
              Turn long, unwieldy URLs into clean short links — and see how
              many people click them.
            </p>

            <div className="input-group">
              <div className="input-wrapper">
                <svg
                  className="input-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Paste your long URL here..."
                  className="url-input"
                  disabled={loading}
                  aria-label="URL to shorten"
                />
              </div>
              <button
                className="btn-shorten"
                onClick={handleShorten}
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <span className="spinner" />
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="15 3 21 3 21 9" />
                      <path d="M21 3l-7 7" />
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    </svg>
                    <span>Shorten</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="error-message" role="alert">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}
          </div>
        </section>

        {/* Stats */}
        {!loadingUrls && urls.length > 0 && (
          <section className="stats-section">
            <div className="stat-card">
              <div className="stat-value">{urls.length}</div>
              <div className="stat-label">Total Links</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalClicks}</div>
              <div className="stat-label">Total Clicks</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{todayLinks}</div>
              <div className="stat-label">Created Today</div>
            </div>
          </section>
        )}

        {/* Links list */}
        <section className="links-section">
          <div className="links-header">
            <h2 className="links-title">Your Links</h2>
            {urls.length > 0 && (
              <span className="links-count">
                {urls.length} link{urls.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loadingUrls ? (
            <div className="links-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="link-card skeleton-card">
                  <div className="skeleton-line w-70" />
                  <div className="skeleton-line w-50" />
                  <div className="skeleton-line w-30" />
                </div>
              ))}
            </div>
          ) : urls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h3>No links yet</h3>
              <p>
                Paste a URL above and click Shorten to create your first link.
              </p>
            </div>
          ) : (
            <div className="links-grid">
              {urls.map((item) => (
                <article key={item.id} className="link-card">
                  <div className="link-card-top">
                    <span className="link-date">
                      {formatDate(item.created_at)}
                    </span>
                    <button
                      className={`btn-copy ${copiedId === item.id ? "copied" : ""}`}
                      onClick={() =>
                        copyToClipboard(item.short_url, item.id)
                      }
                      aria-label="Copy short URL"
                      title="Copy short URL"
                    >
                      {copiedId === item.id ? (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <p className="link-original" title={item.original_url}>
                    {truncateUrl(item.original_url)}
                  </p>

                  <a
                    href={item.short_url}
                    target="_blank"
                    rel="noreferrer"
                    className="link-short"
                  >
                    {item.short_url}
                  </a>

                  <div className="link-card-footer">
                    <div className="click-count">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M15 15l-2 5L9 9l11 4-5 2z" />
                        <path d="M18.5 18.5L22 22" />
                      </svg>
                      <span className="click-num">{item.click_count}</span>
                      <span className="click-label">
                        click{item.click_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Snip &mdash; URL Shortener</p>
      </footer>
    </div>
  );
}

export default App;