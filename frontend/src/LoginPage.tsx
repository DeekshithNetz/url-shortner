import { GoogleLogin } from "@react-oauth/google";
import "./LoginPage.css";

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/urls/auth/google`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: credentialResponse.credential }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Google login failed");
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onLogin(data.access_token);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Google login failed");
    }
  };

  return (
    <div className="lp">
      {/* Subtle background shapes for depth (Light theme) */}
      <div className="lp__bg lp__bg--1"></div>
      <div className="lp__bg lp__bg--2"></div>

      {/* Header matching App exactly */}
      <header className="lp__hdr">
        <div className="lp__hdr-inner">
          <a href="/" className="lp__brand">
            <span className="lp__logo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </span>
            <span className="lp__name">Sniply</span>
          </a>
        </div>
      </header>

      {/* Main Content: Story + Login */}
      <main className="lp__main">
        
        {/* Left: The Story / Marketing Copy */}
        <section className="lp__story">
          
          
          <h1 className="lp__title">
            Shorten your links.<br />
            <span className="lp__title-accent">Amplify your reach.</span>
          </h1>
          
          <p className="lp__desc">
            Transform long, unwieldy URLs into clean, shareable short links. Monitor every click with a beautiful, real-time analytics dashboard.
          </p>

          <div className="lp__features">
            <div className="lp__feat">
              <div className="lp__feat-icon lp__feat-icon--blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" />
                </svg>
              </div>
              <div>
                <strong>Lightning Fast</strong>
                <p>Instant redirects with 99.9% uptime.</p>
              </div>
            </div>
            
          
            <div className="lp__feat">
              <div className="lp__feat-icon lp__feat-icon--violet">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <strong>Secure & Private</strong>
                <p>Enterprise-grade link security built-in.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Login Card */}
        <aside className="lp__form-side">
          <div className="lp__card">
            <div className="lp__card-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>

            <h2 className="lp__card-title">Welcome to Sniply</h2>
            <p className="lp__card-sub">
              Sign in to your dashboard to start creating and tracking links.
            </p>

            <div className="lp__card-action">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.log("Login Failed")}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="340"
              />
            </div>

            <p className="lp__card-foot">
              Secured by Google Authentication
            </p>
          </div>
        </aside>

      </main>

      {/* Footer matching App exactly */}
      <footer className="lp__ftr">
        <div className="lp__ftr-in">
          <span className="lp__ftr-b">Sniply</span>
          <span className="lp__ftr-d">·</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}