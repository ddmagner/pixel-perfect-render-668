import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const scrollToTop = () => {
      try {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        // Reset common scrollable containers
        document.querySelectorAll('.overflow-y-auto').forEach((el) => {
          (el as HTMLElement).scrollTop = 0;
        });
      } catch {}
    };

    // Run multiple times to beat layout/async paints
    scrollToTop();
    requestAnimationFrame(scrollToTop);
    setTimeout(scrollToTop, 0);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
