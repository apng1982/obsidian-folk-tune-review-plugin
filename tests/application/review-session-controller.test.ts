import { describe, expect, it, vi } from "vitest";

import { ReviewSessionController } from "../../src/application/review-session-controller";
import { parseLocalDate } from "../../src/domain/dates";
import { getCurrentTune } from "../../src/domain/review-session";
import type { Tune } from "../../src/domain/tune";

const clock = {
  today: () => parseLocalDate("2026-06-08"),
};

describe("review session controller", () => {
  it("writes expected latest review state before advancing a live session", async () => {
    const first = tune("one");
    const second = tune("two");
    const writer = { writeReview: vi.fn().mockResolvedValue(undefined) };
    const controller = new ReviewSessionController(
      [first, second],
      "live",
      clock,
      writer,
    );

    await controller.score(9);

    expect(writer.writeReview).toHaveBeenCalledWith(first, {
      intervalDays: 365,
      lastReviewed: "2026-06-08",
      nextDue: "2027-06-08",
      score: 9,
    });
    expect(getCurrentTune(controller.session)).toBe(second);
  });

  it("maps score zero to one day in live mode", async () => {
    const writer = { writeReview: vi.fn().mockResolvedValue(undefined) };
    const controller = new ReviewSessionController(
      [tune("one")],
      "live",
      clock,
      writer,
    );

    await controller.score(0);

    expect(writer.writeReview).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        intervalDays: 1,
        nextDue: "2026-06-09",
        score: 0,
      }),
    );
  });

  it("rejects an invalid score before a live write", async () => {
    const writer = { writeReview: vi.fn().mockResolvedValue(undefined) };
    const controller = new ReviewSessionController(
      [tune("one")],
      "live",
      clock,
      writer,
    );

    await expect(controller.score(10)).rejects.toThrow(RangeError);
    expect(writer.writeReview).not.toHaveBeenCalled();
    expect(getCurrentTune(controller.session)?.id).toBe("one");
  });

  it("does not advance when a live write fails", async () => {
    const writer = {
      writeReview: vi.fn().mockRejectedValue(new Error("write failed")),
    };
    const controller = new ReviewSessionController(
      [tune("one"), tune("two")],
      "live",
      clock,
      writer,
    );

    await expect(controller.score(4)).rejects.toThrow("write failed");
    expect(getCurrentTune(controller.session)?.id).toBe("one");
    expect(controller.session.items[0]?.outcome.type).toBe("pending");
  });

  it("never calls the writer in dry-run mode", async () => {
    const writer = { writeReview: vi.fn().mockResolvedValue(undefined) };
    const first = frozenTune("one");
    const second = frozenTune("two");
    const controller = new ReviewSessionController(
      [first, second],
      "dry-run",
      clock,
      writer,
    );

    await controller.score(5);
    controller.skip();
    controller.end();

    expect(writer.writeReview).not.toHaveBeenCalled();
    expect(first.review.state).toBeUndefined();
    expect(second.review.state).toBeUndefined();
  });

  it("skip and end never write in live mode", () => {
    const writer = { writeReview: vi.fn().mockResolvedValue(undefined) };
    const controller = new ReviewSessionController(
      [tune("one"), tune("two")],
      "live",
      clock,
      writer,
    );

    controller.skip();
    controller.end();

    expect(writer.writeReview).not.toHaveBeenCalled();
    expect(controller.session.items[1]?.outcome.type).toBe("pending");
  });

  it("requires a writer for live mode", () => {
    expect(
      () => new ReviewSessionController([tune("one")], "live", clock),
    ).toThrow("Live review session requires a review writer.");
  });
});

function tune(id: string): Tune {
  return {
    id,
    keys: [],
    path: `Tunes/Tunes/${id}.md`,
    review: {
      excludedFromReview: false,
      sessionMaintained: false,
    },
    title: id,
  };
}

function frozenTune(id: string): Tune {
  const value = tune(id);
  Object.freeze(value.review);
  return Object.freeze(value);
}
