import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * SpaRedirector handles 404 fallback redirects for SPAs.
 * 
 * When a static host (Lovable, Netlify) returns 404 for routes like /auth,
 * the 404.html page stores the original path and redirects to /?redirect=path
 * This component then navigates to the correct route, preserving hash fragments.
 */
export default function SpaRedirector() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect");
    
    if (!redirect) return;

    try {
      const decoded = decodeURIComponent(redirect);
      console.log('SpaRedirector: Redirecting to', decoded, 'with hash', location.hash);
      navigate(`${decoded}${location.hash ?? ""}`, { replace: true });
    } catch (error) {
      console.error('SpaRedirector: Failed to decode redirect path', error);
    }
  }, [location.search, location.hash, navigate]);

  return null;
}
