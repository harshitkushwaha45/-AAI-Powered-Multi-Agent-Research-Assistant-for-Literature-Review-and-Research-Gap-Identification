import { useEffect, useRef, useState, useCallback } from "react";
import { fetchSession, fetchSessionPapers } from "../api/researchApi.js";

const POLL_INTERVAL_MS = 3000;
const ACTIVE_STATUSES = new Set(["pending", "running"]);
const MAX_CONSECUTIVE_ERRORS = 5;

/** Polls a research session until its pipeline finishes, with resilient retry handling. */
export function useResearchSession(sessionId) {
  const [session, setSession] = useState(null);
  const [papers, setPapers] = useState([]);
  const [error, setError] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const papersLoadedRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);
  const retryTimeoutRef = useRef(null);

  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return;

    try {
      const data = await fetchSession(sessionId);
      consecutiveErrorsRef.current = 0;
      setError(null);
      setIsReconnecting(false);
      setSession(data);

      if (!ACTIVE_STATUSES.has(data.status) && !papersLoadedRef.current) {
        papersLoadedRef.current = true;
        try {
          const paperData = await fetchSessionPapers(sessionId);
          setPapers(paperData);
        } catch {
          // Non-fatal paper fetch error
        }
      }

      if (ACTIVE_STATUSES.has(data.status)) {
        retryTimeoutRef.current = setTimeout(() => {
          fetchSessionData();
        }, POLL_INTERVAL_MS);
      }
    } catch (err) {
      consecutiveErrorsRef.current += 1;
      const errMsg = err.response?.data?.error || err.message || "Connection lost";

      if (consecutiveErrorsRef.current < MAX_CONSECUTIVE_ERRORS) {
        // Transient error — mark reconnecting and retry automatically
        setIsReconnecting(true);
        const backoffMs = Math.min(POLL_INTERVAL_MS * consecutiveErrorsRef.current, 6000);
        retryTimeoutRef.current = setTimeout(() => {
          fetchSessionData();
        }, backoffMs);
      } else {
        // Persistent failure after 5 retries
        setIsReconnecting(false);
        setError(errMsg);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    papersLoadedRef.current = false;
    consecutiveErrorsRef.current = 0;
    setError(null);
    setIsReconnecting(false);

    fetchSessionData();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [sessionId, fetchSessionData]);

  const refetch = useCallback(() => {
    consecutiveErrorsRef.current = 0;
    setError(null);
    setIsReconnecting(false);
    fetchSessionData();
  }, [fetchSessionData]);

  return { session, papers, error, isReconnecting, refetch };
}
