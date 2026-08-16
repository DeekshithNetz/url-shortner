const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log(API_BASE_URL);
export async function createShortUrl(url: string) {
    console.log(API_BASE_URL);
  const response = await fetch(`${API_BASE_URL}/api/urls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to shorten URL");
  }

  return response.json();
}

export async function getAllUrls() {
    console.log("eroror");
  const response = await fetch(`${API_BASE_URL}/api/urls`);

  if (!response.ok) {
    throw new Error("Failed to fetch URLs");
  }

  return response.json();
}
//done