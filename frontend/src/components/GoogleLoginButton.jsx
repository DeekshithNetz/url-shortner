import { GoogleLogin } from "@react-oauth/google";

function GoogleLoginButton() {
  const handleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/google`,
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
        throw new Error(data.detail || "Google login failed");
      }

      localStorage.setItem("access_token", data.access_token);

      console.log("Logged in:", data);

      // Navigate to dashboard here
      // window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <GoogleLogin
      onSuccess={handleSuccess}
      onError={() => {
        console.log("Google Login Failed");
      }}
    />
  );
}

export default GoogleLoginButton;