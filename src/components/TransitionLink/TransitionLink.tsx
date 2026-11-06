import { Link } from 'react-router-dom';
import type { MouseEvent, ReactNode } from 'react';
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate';

interface TransitionLinkProps {
  to: string;
  className?: string;
  children: ReactNode;
}

/**
 * A `Link` that navigates inside a View Transition.
 *
 * It stays an anchor with a real `href` rather than becoming a button, so
 * middle-click, cmd-click and "open in new tab" all keep working — the
 * handler bails out on any of those and lets the browser do its job.
 */
const TransitionLink = ({ to, className, children }: TransitionLinkProps) => {
  const transitionNavigate = useTransitionNavigate();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    // Anything that is not a plain left-click belongs to the browser.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    transitionNavigate(to);
  };

  return (
    <Link to={to} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
};

export default TransitionLink;
