import Cookies from 'js-cookie';

const configuredCookieDomain = String(import.meta.env.VITE_COOKIE_DOMAIN || "").trim();

export const logoutAll = (redirectPath = import.meta.env.VITE_REDIRECT_URL || '/login') => {
  // 1. Delete all authentication cookies
  const cookiesToDelete = ['authToken', 'userInfo'];
  const isProduction = !window.location.hostname.includes('localhost');
  
  // Triple deletion strategy
  cookiesToDelete.forEach(name => {
    // Standard deletion
    Cookies.remove(name, { 
      path: '/', 
      domain: isProduction ? configuredCookieDomain || undefined : undefined,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax'
    });
    
    // DOM cookie API deletion
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    if (isProduction && configuredCookieDomain) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; `
        + `path=/; domain=${configuredCookieDomain}; secure; samesite=None`;
    }
  });


  const timestamp = Date.now();
  window.location.replace(`${redirectPath}?logout=${timestamp}`);
  window.location.reload(); // Force browser to reload clean state
  

};
