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
    const writer = reviewWriter();
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
    const writer = reviewWriter();
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
    const writer = reviewWriter();
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
    const writer = reviewWriter();
    writer.writeReview.mockRejectedValue(new Error("write failed"));
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

  it("writes an excluded flag before advancing a live session", async () => {
    const first = tune("one");
    const second = tune("two");
    const writer = reviewWriter();
    const controller = new ReviewSessionController(
      [first, second],
      "live",
      clock,
      writer,
    );

    await controller.exclude();

    expect(writer.writeReviewFlag).toHaveBeenCalledWith(
      first,
      "excludedFromReview",
      true,
    );
    expect(writer.writeReview).not.toHaveBeenCalled();
    expect(controller.session.items[0]?.outcome.type).toBe("excluded");
    expect(getCurrentTune(controller.session)).toBe(second);
  });

  it("writes a session-maintained flag before advancing a live session", async () => {
    const first = tune("one");
    const second = tune("two");
    const writer = reviewWriter();
    const controller = new ReviewSessionController(
      [first, second],
      "live",
      clock,
      writer,
    );

    await controller.markSessionMaintained();

    expect(writer.writeReviewFlag).toHaveBeenCalledWith(
      first,
      "sessionMaintained",
      true,
    );
    expect(writer.writeReview).not.toHaveBeenCalled();
    expect(controller.session.items[0]?.outcome.type).toBe(
      "session-maintained",
    );
    expect(getCurrentTune(controller.session)).toBe(second);
  });

  it("does not advance when a live flag write fails", async () => {
    const writer = reviewWriter();
    writer.writeReviewFlag.mockRejectedValue(new Error("flag write failed"));
    const controller = new ReviewSessionController(
      [tune("one"), tune("two")],
      "live",
      clock,
      writer,
    );

    await expect(controller.exclude()).rejects.toThrow("flag write failed");
    expect(getCurrentTune(controller.session)?.id).toBe("one");
    expect(controller.session.items[0]?.outcome.type).toBe("pending");
  });

  it("never calls the writer in dry-run mode", async () => {
    const writer = reviewWriter();
    const first = frozenTune("one");
    const second = frozenTune("two");
    const third = frozenTune("three");
    const fourth = frozenTune("four");
    const controller = new ReviewSessionController(
      [first, second, third, fourth],
      "dry-run",
      clock,
      writer,
    );

    await controller.score(5);
    controller.skip();
    await controller.exclude();
    await controller.markSessionMaintained();
    controller.end();

    expect(writer.writeReview).not.toHaveBeenCalled();
    expect(writer.writeReviewFlag).not.toHaveBeenCalled();
    expect(first.review.state).toBeUndefined();
    expect(second.review.state).toBeUndefined();
    expect(third.review.state).toBeUndefined();
    expect(fourth.review.state).toBeUndefined();
  });

  it("skip and end never write in live mode", () => {
    const writer = reviewWriter();
    const controller = new ReviewSessionController(
      [tune("one"), tune("two")],
      "live",
      clock,
      writer,
    );

    controller.skip();
    controller.end();

    expect(writer.writeReview).not.toHaveBeenCalled();
    expect(writer.writeReviewFlag).not.toHaveBeenCalled();
    expect(controller.session.items[1]?.outcome.type).toBe("pending");
  });

  it("requires a writer for live mode", () => {
    expect(
      () => new ReviewSessionController([tune("one")], "live", clock),
    ).toThrow("Live review session requires a review writer.");
  });
});

function reviewWriter() {
  return {
    writeReview: vi.fn().mockResolvedValue(undefined),
    writeReviewFlag: vi.fn().mockResolvedValue(undefined),
  };
}

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
