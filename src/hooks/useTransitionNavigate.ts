import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useViewTransition } from './useViewTransition';

/**
 * `navigate`, wrapped in a View Transition.
 *
 * `flushSync` is the load-bearing part. `startViewTransition` snapshots the
 * page, runs the callback, then snapshots again — so the DOM has to have
 * actually changed by the time the callback returns. React batches state
 * updates by default, which would leave the second snapshot identical to the
 * first and produce no transition at all.
 */
export const useTransitionNavigate = () => {
  const navigate = useNavigate();
  const withTransition = useViewTransition();

  return useCallback(
    (path: string): void => {
      withTransition(() => {
        flushSync(() => {
          void navigate(path);
        });
      });
    },
    [navigate, withTransition]
  );
};
