/**
 * True on Apple platforms, where the palette shortcut is Command rather
 * than Control.
 *
 * `userAgentData.platform` is the modern reading; `navigator.platform` is
 * deprecated but still the only answer in Firefox and Safari, so it stays
 * as the fallback.
 */
export const isApplePlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const withData = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const platform =
    withData.userAgentData?.platform ?? navigator.platform ?? '';
  return /mac|iphone|ipad|ipod/i.test(platform);
};

/** The shortcut as it should be printed on this machine's keyboard. */
export const paletteShortcutLabel = (): string =>
  isApplePlatform() ? '\u2318 K' : 'Ctrl K';
