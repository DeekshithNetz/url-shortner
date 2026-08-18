const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log("API:", API_BASE_URL);

function getAuthHeaders() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    throw new Error("User is not logged in");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function createShortUrl(url: string) {
  const response = await fetch(`${API_BASE_URL}/api/urls`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      url,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access_token");
    }

    throw new Error("Failed to shorten URL");
  }

  return response.json();
}

export async function getAllUrls() {
  const response = await fetch(`${API_BASE_URL}/api/urls`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("access_token");
    }

    throw new Error("Failed to fetch URLs");
  }

  return response.json();
}