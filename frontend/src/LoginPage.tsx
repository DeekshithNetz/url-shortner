import { GoogleLogin } from "@react-oauth/google";

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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credentialResponse.credential,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Google login failed"
        );
      }

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      onLogin(data.access_token);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Google login failed"
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">🔗</div>

        <h1>URL Shortener</h1>

        <p className="login-subtitle">
          Shorten your URLs quickly and securely
        </p>

        <div className="google-login">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              console.log("Google Login Failed");
            }}
            theme="outline"
            size="large"
            text="signin_with"
            shape="rectangular"
            width="300"
          />
        </div>

        <p className="login-footer">
          Sign in with Google to continue
        </p>
      </div>
    </div>
  );
}