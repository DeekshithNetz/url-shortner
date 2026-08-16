interface Env {
  ASSETS: Fetcher;
}

const API_BASE_URL = "https://url-shortner-ajqh.onrender.com";

const REACT_ROUTES = new Set([
  "/",
  "/about",
  "/contact",
  "/login",
  "/register",
  "/dashboard",
]);

export default {
  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // These belong to React
    if (REACT_ROUTES.has(pathname)) {
      return env.ASSETS.fetch(request);
    }

    // Static files belong to React
    if (
      pathname.startsWith("/assets/") ||
      pathname.startsWith("/images/") ||
      pathname.startsWith("/favicon") ||
      pathname.includes(".")
    ) {
      return env.ASSETS.fetch(request);
    }

    // Everything else is a short URL
    const backendUrl =
      API_BASE_URL + pathname + url.search;

    return fetch(backendUrl, {
      method: request.method,
      headers: request.headers,
      body:
        request.method === "GET" ||
        request.method === "HEAD"
          ? undefined
          : request.body,
      redirect: "manual",
    });
  },
};