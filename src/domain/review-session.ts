import { parseReviewScore, type ReviewScore } from "./review-score";
import type { ReviewMode } from "./review-mode";
import type { Tune } from "./tune";

export type ReviewSessionStatus = "active" | "completed" | "ended";

export type ReviewSessionItemOutcome =
  | { readonly type: "pending" }
  | { readonly type: "excluded" }
  | { readonly score: ReviewScore; readonly type: "scored" }
  | { readonly type: "session-maintained" }
  | { readonly type: "skipped" };

export interface ReviewSessionItem {
  readonly outcome: ReviewSessionItemOutcome;
  readonly tune: Tune;
}

export interface ReviewSession {
  readonly currentIndex?: number;
  readonly items: readonly ReviewSessionItem[];
  readonly status: ReviewSessionStatus;
}

export interface ReviewSessionSummary {
  readonly excluded: number;
  readonly message: string;
  readonly scored: number;
  readonly sessionMaintained: number;
  readonly skipped: number;
  readonly total: number;
  readonly unreviewed: number;
}

export function createReviewSession(queue: readonly Tune[]): ReviewSession {
  const items = queue.map((tune) => ({
    outcome: { type: "pending" } as const,
    tune,
  }));

  return {
    currentIndex: items.length > 0 ? 0 : undefined,
    items,
    status: items.length > 0 ? "active" : "completed",
  };
}

export function scoreCurrentTune(
  session: ReviewSession,
  scoreValue: number,
): ReviewSession {
  assertActiveSession(session);
  const score = parseReviewScore(scoreValue);

  return advanceSession(session, {
    score,
    type: "scored",
  });
}

export function skipCurrentTune(session: ReviewSession): ReviewSession {
  assertActiveSession(session);
  return advanceSession(session, { type: "skipped" });
}

export function excludeCurrentTune(session: ReviewSession): ReviewSession {
  assertActiveSession(session);
  return advanceSession(session, { type: "excluded" });
}

export function markCurrentTuneSessionMaintained(
  session: ReviewSession,
): ReviewSession {
  assertActiveSession(session);
  return advanceSession(session, { type: "session-maintained" });
}

export function endReviewSession(session: ReviewSession): ReviewSession {
  if (session.status !== "active") {
    return session;
  }

  return {
    items: session.items,
    status: "ended",
  };
}

export function getCurrentTune(session: ReviewSession): Tune | undefined {
  return session.currentIndex === undefined
    ? undefined
    : session.items[session.currentIndex]?.tune;
}

export function summarizeDryRunSession(
  session: ReviewSession,
): ReviewSessionSummary {
  return summarizeReviewSession(session, "dry-run");
}

export function summarizeReviewSession(
  session: ReviewSession,
  mode: ReviewMode,
): ReviewSessionSummary {
  const scored = session.items.filter(
    ({ outcome }) => outcome.type === "scored",
  ).length;
  const excluded = session.items.filter(
    ({ outcome }) => outcome.type === "excluded",
  ).length;
  const sessionMaintained = session.items.filter(
    ({ outcome }) => outcome.type === "session-maintained",
  ).length;
  const skipped = session.items.filter(
    ({ outcome }) => outcome.type === "skipped",
  ).length;
  const unreviewed =
    session.items.length - scored - excluded - sessionMaintained - skipped;

  return {
    excluded,
    message:
      mode === "dry-run"
        ? "Dry run complete. No tune metadata was changed."
        : "Live review complete. Reviewed tune metadata was saved.",
    scored,
    sessionMaintained,
    skipped,
    total: session.items.length,
    unreviewed,
  };
}

function advanceSession(
  session: ReviewSession,
  outcome: ReviewSessionItemOutcome,
): ReviewSession {
  const currentIndex = session.currentIndex;
  if (currentIndex === undefined) {
    throw new Error("Active review session has no current tune.");
  }

  const items = session.items.map((item, index) =>
    index === currentIndex ? { ...item, outcome } : item,
  );
  const nextIndex = items.findIndex(
    (item, index) => index > currentIndex && item.outcome.type === "pending",
  );

  return {
    currentIndex: nextIndex === -1 ? undefined : nextIndex,
    items,
    status: nextIndex === -1 ? "completed" : "active",
  };
}

function assertActiveSession(session: ReviewSession): void {
  if (session.status !== "active") {
    throw new Error("Review session is not active.");
  }
}
