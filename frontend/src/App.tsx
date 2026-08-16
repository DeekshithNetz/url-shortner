import { useEffect, useState } from "react";
import {
  createShortUrl,
  getAllUrls,
} from "./services/api";

type URLItem = {
  id: number;
  original_url: string;
  short_code: string;
  short_url: string;
  click_count: number;
  created_at: string;
};

function App() {
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState<URLItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadUrls() {
    try {
      console.log("requesr");
      const data = await getAllUrls();
      setUrls(data);
    } catch {
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
    } catch {
      setError("Failed to shorten URL");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUrls();
  }, []);

  return (
    <div>
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
        </div>
      ))}
    </div>
  );
}

export default App;