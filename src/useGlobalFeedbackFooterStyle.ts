import { useCallback, useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';

export const SITE_FOOTER_SELECTOR = '[data-od-id="site-footer"]';

type StoreSubscriber = () => void;

function getFooterOffset(siteFooterSelector: string): number {
  if (typeof document === 'undefined' || typeof window === 'undefined') return 0;

  const footer = document.querySelector<HTMLElement>(siteFooterSelector);
  if (!footer) return 0;

  const footerTop = footer.getBoundingClientRect().top;
  return Math.max(0, Math.ceil(window.innerHeight - footerTop));
}

function subscribeToFooterChanges(siteFooterSelector: string, onStoreChange: StoreSubscriber) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => undefined;

  const footer = document.querySelector<HTMLElement>(siteFooterSelector);
  window.addEventListener('scroll', onStoreChange, { passive: true });
  window.addEventListener('resize', onStoreChange);

  let resizeObserver: ResizeObserver | null = null;
  if (footer && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(onStoreChange);
    resizeObserver.observe(footer);
  }

  return () => {
    window.removeEventListener('scroll', onStoreChange);
    window.removeEventListener('resize', onStoreChange);
    resizeObserver?.disconnect();
  };
}

export function useGlobalFeedbackFooterStyle(siteFooterSelector = SITE_FOOTER_SELECTOR): CSSProperties | undefined {
  const subscribe = useCallback(
    (onStoreChange: StoreSubscriber) => subscribeToFooterChanges(siteFooterSelector, onStoreChange),
    [siteFooterSelector],
  );
  const getSnapshot = useCallback(() => getFooterOffset(siteFooterSelector), [siteFooterSelector]);
  const footerOffset = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  return footerOffset > 0
    ? ({ '--global-feedback-footer-offset': `${footerOffset}px` } as CSSProperties)
    : undefined;
}
