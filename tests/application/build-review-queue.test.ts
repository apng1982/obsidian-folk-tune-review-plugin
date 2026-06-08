import { describe, expect, it } from "vitest";

import { buildReviewQueue } from "../../src/application/build-review-queue";
import { parseLocalDate } from "../../src/domain/dates";
import type { Tune } from "../../src/domain/tune";

describe("build review queue", () => {
  it("loads tunes from the repository and uses the injected clock", async () => {
    const tunes = [tune("one"), tune("two")];
    const repository = {
      getTunes: async () => Promise.resolve(tunes),
    };
    const clock = {
      today: () => parseLocalDate("2026-01-01"),
    };

    const result = await buildReviewQueue(repository, clock, {
      count: 1,
      includeExcluded: false,
      includeSessionMaintained: false,
      randomize: false,
    });

    expect(result).toEqual([tunes[0]]);
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
