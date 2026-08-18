import { useEffect, useState } from "react";
import {
  createShortUrl,
  getAllUrls,
} from "./services/api";
import LoginPage from "./LoginPage";

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

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("access_token")
  );

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
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
    } catch (error) {
      console.error(error);
      setError("Failed to load URLs");
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
    } catch (error) {
      console.error(error);
      setError("Failed to shorten URL");
    } finally {
      setLoading(false);
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
    <div>
      {/* USER DETAILS */}
      {user && (
        <div>
          {user.profile_picture && (
            <img
              src={user.profile_picture}
              alt={user.name || "User"}
              width={50}
              height={50}
              style={{
                borderRadius: "50%",
              }}
            />
          )}

          <h2>
            Welcome, {user.name || "User"}
          </h2>

          <p>{user.email}</p>
        </div>
      )}

      <button onClick={handleLogout}>
        Logout
      </button>

      <hr />

      <h1>URL Shortener</h1>

      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste your URL"
      />

      <button
        onClick={handleShorten}
        disabled={loading}
      >
        {loading ? "Shortening..." : "Shorten"}
      </button>

      {error && <p>{error}</p>}

      <h2>Your URLs</h2>

      {urls.map((item) => (
        <div key={item.id}>
          <p>
            <strong>Original:</strong>{" "}
            {item.original_url}
          </p>

          <p>
            <strong>Short:</strong>{" "}
            <a
              href={item.short_url}
              target="_blank"
              rel="noreferrer"
            >
              {item.short_url}
            </a>
          </p>

          <p>
            Clicks: {item.click_count}
          </p>

          <hr />
        </div>
      ))}
    </div>
  );
}

export default App;