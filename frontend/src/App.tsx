import { useEffect, useState, useRef } from "react";
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
  const [justCreated, setJustCreated] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  };

  const handleLogout = () => {
    setProfileOpen(false);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setUrls([]);
  };

  // Close profile menu on outside tap
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  async function loadUrls() {
    try {
      setError("");
      const data = await getAllUrls();
      setUrls(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load URLs.");
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
      setJustCreated(true);
      setTimeout(() => setJustCreated(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(shortUrl: string, id: number) {
    try {
      await navigator.clipboard.writeText(shortUrl);
    } catch {
      const t = document.createElement("textarea");
      t.value = shortUrl;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      document.body.removeChild(t);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  }

  function fmtTime(d: string) {
    return new Date(d).toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit",
    });
  }

  function trunc(s: string, n: number = 50) {
    return s.length <= n ? s : s.slice(0, n) + "…";
  }

  function getDomain(s: string) {
    try { return new URL(s).hostname.replace("www.", ""); }
    catch { return s; }
  }

  useEffect(() => {
    if (token) loadUrls();
  }, [token]);

  if (!token) return <LoginPage onLogin={handleLogin} />;

  const totalClicks = urls.reduce((a, u) => a + u.click_count, 0);

  return (
    <div className="app">
      {/* ═══ HEADER ═══ */}
      <header className="hdr">
        <div className="hdr__bar">
          <div className="hdr__left">
            <a href="/" className="hdr__brand">
              <span className="hdr__logo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </span>
              <span className="hdr__name">Sniply</span>
            </a>
          </div>

          <div className="hdr__right">
            {user && (
              <>
                {/* Desktop user info — hidden on mobile */}
                <div className="hdr__user">
                  {user.profile_picture ? (
                    <img src={user.profile_picture} alt="" className="hdr__avatar" />
                  ) : (
                    <span className="hdr__avatar-fb">
                      {(user.name || user.email)[0].toUpperCase()}
                    </span>
                  )}
                  <span className="hdr__uname">{user.name || "User"}</span>
                  <span className="hdr__uemail">{user.email}</span>
                </div>
                <span className="hdr__sep" />

                {/* Desktop logout button — hidden on mobile */}
                <button className="hdr__logout" onClick={handleLogout} aria-label="Sign out">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>

                {/* Mobile profile toggle — hidden on desktop */}
                <div className="hdr__mob-profile" ref={profileRef}>
                  <button
                    className={`hdr__mob-btn ${profileOpen ? "is-open" : ""}`}
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-label="Profile menu"
                    aria-expanded={profileOpen}
                  >
                    {user.profile_picture ? (
                      <img src={user.profile_picture} alt="" className="hdr__avatar" />
                    ) : (
                      <span className="hdr__avatar-fb">
                        {(user.name || user.email)[0].toUpperCase()}
                      </span>
                    )}
                  </button>

                  {profileOpen && (
                    <div className="hdr__mob-drop">
                      <div className="hdr__mob-drop-info">
                        <span className="hdr__mob-drop-name">{user.name || "User"}</span>
                        <span className="hdr__mob-drop-email">{user.email}</span>
                      </div>
                      <button className="hdr__mob-drop-logout" onClick={handleLogout}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                          <polyline points="16 17 21 12 16 7" />
                          <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="main">
        <div className="wrap">

          {/* ── Hero ── */}
          <section className="hero">
            <h1 className="hero__h">
              Shorten. Share. <span className="hero__a">Track.</span>
            </h1>
            <p className="hero__p">
              Turn long, unwieldy URLs into clean short links and monitor every click with real-time analytics.
            </p>

            <form className="frm" onSubmit={handleShorten} autoComplete="off">
              <div className="frm__field">
                <svg className="frm__ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/your-long-url-here"
                  className="frm__inp"
                  required
                />
              </div>
              <button
                type="submit"
                className={`frm__btn ${justCreated ? "frm__btn--ok" : ""}`}
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <><span className="sp" />Shortening…</>
                ) : justCreated ? (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Created</>
                ) : (
                  "Shorten URL"
                )}
              </button>
            </form>

            {error && (
              <div className="frm__err">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}
          </section>

          {/* ── Stats ── */}
          <section className="sts">
            <div className="st st--blue">
              <div className="st__ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div className="st__body">
                <span className="st__v">{urls.length}</span>
                <span className="st__l">Total Links</span>
              </div>
            </div>
            <div className="st st--green">
              <div className="st__ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="st__body">
                <span className="st__v">{totalClicks}</span>
                <span className="st__l">Total Clicks</span>
              </div>
            </div>
            <div className="st st--violet">
              <div className="st__ico">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="20" x2="12" y2="10" />
                  <line x1="18" y1="20" x2="18" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="16" />
                </svg>
              </div>
              <div className="st__body">
                <span className="st__v">{urls.length ? (totalClicks / urls.length).toFixed(1) : "0"}</span>
                <span className="st__l">Avg. / Link</span>
              </div>
            </div>
          </section>

          {/* ── Links ── */}
          <section className="lks">
            <div className="lks__hd">
              <h2 className="lks__t">
                Your Links
                {urls.length > 0 && <span className="lks__cnt">{urls.length}</span>}
              </h2>
              <button className="lks__rf" onClick={loadUrls} aria-label="Refresh list">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </button>
            </div>

            {urls.length === 0 ? (
              <div className="emp">
                <div className="emp__ring">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <h3 className="emp__t">No links yet</h3>
                <p className="emp__d">Paste a URL above and hit <strong>Shorten URL</strong> to get started.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="tw">
                  <table className="tb">
                    <thead>
                      <tr>
                        <th>Original URL</th>
                        <th>Short Link</th>
                        <th>Clicks</th>
                        <th>Created</th>
                        <th><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {urls.map((item, i) => (
                        <tr key={item.id} className={justCreated && i === 0 ? "tb__r--new" : ""}>
                          <td>
                            <span className="tb__dm">{getDomain(item.original_url)}</span>
                            <span className="tb__ur" title={item.original_url}>{trunc(item.original_url, 52)}</span>
                          </td>
                          <td>
                            <a href={item.short_url} target="_blank" rel="noreferrer" className="tb__sl">
                              {item.short_url}
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                              </svg>
                            </a>
                          </td>
                          <td><span className="tb__ck">{item.click_count}</span></td>
                          <td>
                            <span className="tb__dt">{fmtDate(item.created_at)}</span>
                            <span className="tb__tm">{fmtTime(item.created_at)}</span>
                          </td>
                          <td>
                            <div className="tb__ac">
                              <button
                                className={`ab ${copiedId === item.id ? "ab--ok" : ""}`}
                                onClick={() => handleCopy(item.short_url, item.id)}
                                title={copiedId === item.id ? "Copied!" : "Copy link"}
                              >
                                {copiedId === item.id ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                              <a href={item.short_url} target="_blank" rel="noreferrer" className="ab" title="Open in new tab">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="cds">
                  {urls.map((item, i) => (
                    <article key={item.id} className={`cd ${justCreated && i === 0 ? "cd--new" : ""}`}>
                      <div className="cd__top">
                        <span className="tb__dm">{getDomain(item.original_url)}</span>
                        <span className="cd__dt">{fmtDate(item.created_at)}</span>
                      </div>
                      <p className="cd__orig" title={item.original_url}>{trunc(item.original_url, 65)}</p>
                      <div className="cd__bot">
                        <a href={item.short_url} target="_blank" rel="noreferrer" className="cd__sl">
                          {item.short_url}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7" /><path d="M7 7h10v10" />
                          </svg>
                        </a>
                        <div className="cd__r">
                          <span className="tb__ck">{item.click_count}</span>
                          <button
                            className={`ab ab--lg ${copiedId === item.id ? "ab--ok" : ""}`}
                            onClick={() => handleCopy(item.short_url, item.id)}
                          >
                            {copiedId === item.id ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                Copied
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="ftr">
        <div className="ftr__in">
          <span className="ftr__b">Sniply</span>
          <span className="ftr__d">·</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;