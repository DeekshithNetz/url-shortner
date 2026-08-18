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

function App() {
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

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

  async function handleShorten(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      setLoading(true);
      setError("");
      await createShortUrl(url);
      setUrl("");
      await loadUrls();
    } catch (err) {
      console.error(err);
      setError("Failed to shorten URL. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(shortUrl: string, id: number) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shortUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function truncateUrl(urlStr: string, maxLen: number = 50) {
    if (urlStr.length <= maxLen) return urlStr;
    return urlStr.substring(0, maxLen) + "…";
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
    <div className="app-layout">
      {/* ─── HEADER ─── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <span className="brand-text">Sniply</span>
          </div>

          <div className="header-right">
            {user && (
              <div className="user-pill">
                {user.profile_picture ? (
                  <img
                    src={user.profile_picture}
                    alt={user.name || "User"}
                    className="user-avatar"
                  />
                ) : (
                  <div className="user-avatar-fallback">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="user-info">
                  <span className="user-name">{user.name || "User"}</span>
                  <span className="user-email">{user.email}</span>
                </div>
                <button className="btn-logout" onClick={handleLogout} title="Logout">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className="app-main">
        {/* Hero / Input Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Shorten your links</h1>
            <p className="hero-subtitle">
              Paste a long URL to create a short, shareable link instantly.
            </p>

            <form className="shorten-form" onSubmit={handleShorten}>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/your-long-url"
                  className="url-input"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-shorten"
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    Shortening…
                  </span>
                ) : (
                  "Shorten"
                )}
              </button>
            </form>

            {error && (
              <div className="error-banner">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}
          </div>
        </section>

        {/* Stats Bar */}
        <section className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{urls.length}</span>
            <span className="stat-label">Total Links</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <span className="stat-value">
              {urls.reduce((sum, u) => sum + u.click_count, 0)}
            </span>
            <span className="stat-label">Total Clicks</span>
          </div>
        </section>

        {/* URL List Section */}
        <section className="urls-section">
          <div className="section-header">
            <h2 className="section-title">Your Links</h2>
            <button className="btn-refresh" onClick={loadUrls} title="Refresh">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>
          </div>

          {urls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h3 className="empty-title">No links yet</h3>
              <p className="empty-text">
                Paste a URL above to create your first shortened link.
              </p>
            </div>
          ) : (
            <div className="urls-list">
              {/* Desktop Table */}
              <div className="urls-table-wrapper">
                <table className="urls-table">
                  <thead>
                    <tr>
                      <th>Original URL</th>
                      <th>Short Link</th>
                      <th>Clicks</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urls.map((item) => (
                      <tr key={item.id}>
                        <td className="td-original" title={item.original_url}>
                          {truncateUrl(item.original_url, 55)}
                        </td>
                        <td className="td-short">
                          <a
                            href={item.short_url}
                            target="_blank"
                            rel="noreferrer"
                            className="short-link"
                          >
                            {item.short_url}
                          </a>
                        </td>
                        <td className="td-clicks">
                          <span className="click-badge">{item.click_count}</span>
                        </td>
                        <td className="td-date">{formatDate(item.created_at)}</td>
                        <td className="td-actions">
                          <button
                            className={`btn-copy ${copiedId === item.id ? "copied" : ""}`}
                            onClick={() => handleCopy(item.short_url, item.id)}
                          >
                            {copiedId === item.id ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Copied
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                          <a
                            href={item.short_url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-visit"
                            title="Visit link"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="urls-cards">
                {urls.map((item) => (
                  <div key={item.id} className="url-card">
                    <div className="card-row">
                      <span className="card-label">Original</span>
                      <a
                        href={item.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="card-original-link"
                        title={item.original_url}
                      >
                        {truncateUrl(item.original_url, 45)}
                      </a>
                    </div>
                    <div className="card-row">
                      <span className="card-label">Short</span>
                      <a
                        href={item.short_url}
                        target="_blank"
                        rel="noreferrer"
                        className="card-short-link"
                      >
                        {item.short_url}
                      </a>
                    </div>
                    <div className="card-footer">
                      <div className="card-meta">
                        <span className="click-badge">{item.click_count} clicks</span>
                        <span className="card-date">{formatDate(item.created_at)}</span>
                      </div>
                      <div className="card-actions">
                        <button
                          className={`btn-copy ${copiedId === item.id ? "copied" : ""}`}
                          onClick={() => handleCopy(item.short_url, item.id)}
                        >
                          {copiedId === item.id ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                        <a
                          href={item.short_url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-visit"
                          title="Visit link"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Sniply. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;