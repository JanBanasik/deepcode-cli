import { useEffect, useState } from "react";
import { readGitBranch } from "../statusline/session-status";

export function useGitBranch(projectRoot: string, busy: boolean): string | null {
  const [state, setState] = useState<{ root: string; branch: string | null } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending || controller.signal.aborted) return;
      pending = true;
      const branch = await readGitBranch(projectRoot, controller.signal);
      pending = false;
      if (!controller.signal.aborted) {
        setState((previous) =>
          previous?.root === projectRoot && previous.branch === branch ? previous : { root: projectRoot, branch }
        );
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 10_000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, [projectRoot, busy]);
  return state?.root === projectRoot ? state.branch : null;
}
