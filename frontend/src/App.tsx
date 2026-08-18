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
  const [recentlyAdded, setRecentlyAdded] = useState<number | null>(null);

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
      setRecentlyAdded(Date.now());
      setTimeout(() => setRecentlyAdded(null), 3000);
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
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = shortUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
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

  function truncateUrl(urlStr: string, maxLen: number = 52) {
    if (urlStr.length <= maxLen) return urlStr;
    return urlStr.substring(0, maxLen) + "…";
  }

  function getDomain(urlStr: string) {
    try {
      return new URL(urlStr).hostname;
    } catch {
      return urlStr;
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

  const totalClicks = urls.reduce((sum, u) => sum + u.click_count, 0);

  return (
    <div className="app-shell">
      {/* Ambient background elements */}
      <div className="bg-layer">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
        <div className="bg-grid"></div>
      </div>

      {/* ─── HEADER ─── */}
      <header className="app-header">
        <div className="header-glass">
          <div className="header-inner">
            <div className="header-brand">
              <div className="brand-mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <span className="brand-name">Sniply</span>
            </div>

            <div className="header-actions">
              {user && (
                <div className="header-user">
                  <div className="user-avatar-ring">
                    {user.profile_picture ? (
                      <img src={user.profile_picture} alt="" className="user-avatar" />
                    ) : (
                      <div className="user-avatar-fallback">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-meta">
                    <span className="user-meta-name">{user.name || "User"}</span>
                    <span className="user-meta-email">{user.email}</span>
                  </div>
                </div>
              )}
              <button className="btn-icon btn-logout" onClick={handleLogout} title="Sign out">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── MAIN ─── */}
      <main className="app-main">
        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Fast & reliable
          </div>
          <h1 className="hero-heading">
            Shorten links.<br />
            <span className="hero-heading-accent">Amplify reach.</span>
          </h1>
          <p className="hero-desc">
            Transform long, unwieldy URLs into clean short links. Track every click with real-time analytics.
          </p>

          <form className="shorten-form" onSubmit={handleShorten}>
            <div className="input-group">
              <div className="input-field">
                <svg className="input-field-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste your URL here..."
                  className="input-text"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <>
                    <span className="spin-sm"></span>
                    Processing
                  </>
                ) : recentlyAdded ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Done
                  </>
                ) : (
                  "Shorten URL"
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="error-toast">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon stat-card-icon--blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{urls.length}</span>
              <span className="stat-card-label">Total Links</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon stat-card-icon--emerald">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">{totalClicks}</span>
              <span className="stat-card-label">Total Clicks</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon stat-card-icon--violet">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="20" x2="12" y2="10" />
                <line x1="18" y1="20" x2="18" y2="4" />
                <line x1="6" y1="20" x2="6" y2="16" />
              </svg>
            </div>
            <div className="stat-card-body">
              <span className="stat-card-value">
                {urls.length > 0 ? (totalClicks / urls.length).toFixed(1) : "0"}
              </span>
              <span className="stat-card-label">Avg. Clicks</span>
            </div>
          </div>
        </section>

        {/* URL List */}
        <section className="links-section">
          <div className="links-section-header">
            <div>
              <h2 className="links-section-title">Your Links</h2>
              <p className="links-section-subtitle">Manage and monitor your shortened URLs</p>
            </div>
            <button className="btn-ghost" onClick={loadUrls}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>

          {urls.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-visual">
                <div className="empty-state-ring">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
              </div>
              <h3 className="empty-state-title">No links created yet</h3>
              <p className="empty-state-desc">
                Paste any URL above and hit <strong>Shorten URL</strong> to get started.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table view */}
              <div className="links-table-wrap">
                <table className="links-table">
                  <thead>
                    <tr>
                      <th>Original URL</th>
                      <th>Short Link</th>
                      <th>Clicks</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {urls.map((item) => (
                      <tr key={item.id} className="link-row">
                        <td className="link-cell-orig">
                          <span className="link-domain-badge">{getDomain(item.original_url)}</span>
                          <span className="link-orig-text" title={item.original_url}>
                            {truncateUrl(item.original_url, 48)}
                          </span>
                        </td>
                        <td className="link-cell-short">
                          <a href={item.short_url} target="_blank" rel="noreferrer" className="link-short-url">
                            {item.short_url}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                            </svg>
                          </a>
                        </td>
                        <td className="link-cell-clicks">
                          <span className="click-count">{item.click_count}</span>
                        </td>
                        <td className="link-cell-date">{formatDate(item.created_at)}</td>
                        <td className="link-cell-actions">
                          <button
                            className={`btn-copy-sm ${copiedId === item.id ? "is-copied" : ""}`}
                            onClick={() => handleCopy(item.short_url, item.id)}
                          >
                            {copiedId === item.id ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                          <a href={item.short_url} target="_blank" rel="noreferrer" className="btn-icon-sm" title="Open link">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

              {/* Mobile card view */}
              <div className="links-cards">
                {urls.map((item) => (
                  <div key={item.id} className="link-card">
                    <div className="link-card-header">
                      <span className="link-domain-badge">{getDomain(item.original_url)}</span>
                      <span className="link-card-date">{formatDate(item.created_at)}</span>
                    </div>
                    <p className="link-card-orig" title={item.original_url}>
                      {truncateUrl(item.original_url, 55)}
                    </p>
                    <div className="link-card-bottom">
                      <a href={item.short_url} target="_blank" rel="noreferrer" className="link-card-short">
                        {item.short_url}
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                        </svg>
                      </a>
                      <div className="link-card-right">
                        <span className="click-count">{item.click_count} clicks</span>
                        <button
                          className={`btn-copy-sm ${copiedId === item.id ? "is-copied" : ""}`}
                          onClick={() => handleCopy(item.short_url, item.id)}
                        >
                          {copiedId === item.id ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <span className="footer-brand">Sniply</span>
          <span className="footer-dot"></span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;