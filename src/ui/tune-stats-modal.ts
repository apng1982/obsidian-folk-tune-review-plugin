import { Modal } from "obsidian";

import type {
  MostOverdueTune,
  NextDueBandCount,
  ScoreCount,
  TuneStats,
} from "../domain/tune-stats";

export class TuneStatsModal extends Modal {
  constructor(
    app: ConstructorParameters<typeof Modal>[0],
    private readonly stats: TuneStats,
    private readonly openTune: (tune: MostOverdueTune) => Promise<void>,
  ) {
    super(app);
  }

  override onOpen(): void {
    this.setTitle("Tune stats");
    this.contentEl.addClass("folk-tune-review-view");
    this.contentEl.addClass("folk-tune-review-stats");

    this.renderSummary();
    this.renderDueBands();
    this.renderScores();
    this.renderMostOverdue();
  }

  override onClose(): void {
    this.contentEl.empty();
  }

  private renderSummary(): void {
    const section = this.contentEl.createEl("section", {
      cls: "folk-tune-review-stats-section",
    });
    section.createEl("h3", { text: "Summary" });
    const list = section.createEl("dl", {
      cls: "folk-tune-review-summary folk-tune-review-stats-summary",
    });

    this.renderSummaryValue(list, "Total tunes", this.stats.totalTuneNotes);
    this.renderSummaryValue(list, "Learned repertoire", this.stats.learnedTunes);
    this.renderSummaryValue(list,
      "Eligible for review", this.stats.eligibleReviewTunes,
      { indented: true },
    );
    this.renderSummaryValue(list,
      "Session-maintained", this.stats.sessionMaintainedTunes,
      { indented: true },
    );
    this.renderSummaryValue(list,
        "Excluded", this.stats.excludedTunes,
        { indented: true });
    this.renderSummaryValue(list,
        "Never reviewed", this.stats.neverReviewedTunes
    );
    this.renderSummaryValue(list, "Due today", this.stats.dueTodayTunes);
    this.renderSummaryValue(list, "Overdue", this.stats.overdueTunes);
    this.renderSummaryValue(list,
      `Reviewed in last ${this.stats.reviewedRecentlyDays} days`, this.stats.reviewedRecentlyTunes,
    );
    this.renderSummaryValue(list, "Backlog to learn", this.stats.tunesToLearn);
  }

  private renderDueBands(): void {
    const section = this.contentEl.createEl("section", {
      cls: "folk-tune-review-stats-section",
    });
    section.createEl("h3", { text: "Next due" });
    const list = section.createEl("dl", {
      cls: "folk-tune-review-summary folk-tune-review-stats-summary",
    });

    for (const band of this.stats.nextDueBands) {
      this.renderDueBand(list, band);
    }
  }

  private renderScores(): void {
    const section = this.contentEl.createEl("section", {
      cls: "folk-tune-review-stats-section",
    });
    section.createEl("h3", { text: "Current scores" });
    section.createEl("p", {
      cls: "folk-tune-review-stats-description",
      text: "Scores are volatile and change for each tune during review.",
    });
    const grid = section.createDiv({
      cls: "folk-tune-review-score-grid folk-tune-review-stats-score-grid",
    });

    for (const scoreCount of this.stats.scoreCounts) {
      this.renderScore(grid, scoreCount);
    }
  }

  private renderMostOverdue(): void {
    const section = this.contentEl.createEl("section", {
      cls: "folk-tune-review-stats-section",
    });
    section.createEl("h3", { text: "Most overdue" });

    if (this.stats.mostOverdueTunes.length === 0) {
      section.createEl("p", {
        cls: "folk-tune-review-empty",
        text: "No reviewed tunes are overdue.",
      });
      return;
    }

    const list = section.createEl("ol", {
      cls: "folk-tune-review-stats-overdue",
    });

    for (const tune of this.stats.mostOverdueTunes) {
      this.renderMostOverdueTune(list, tune);
    }
  }

  private renderSummaryValue(
    container: HTMLElement,
    label: string,
    value: number,
    options: { readonly indented?: boolean } = {},
  ): void {
    const classes = ["folk-tune-review-summary-row"];
    if (options.indented === true) {
      classes.push("folk-tune-review-summary-row-indented");
    }

    const row = container.createDiv({
      cls: classes.join(" "),
    });
    row.createEl("dt", { text: label });
    row.createEl("dd", { text: value.toString() });
  }

  private renderDueBand(
    container: HTMLElement,
    band: NextDueBandCount,
  ): void {
    this.renderSummaryValue(container, band.label, band.count);
  }

  private renderScore(container: HTMLElement, scoreCount: ScoreCount): void {
    const item = container.createDiv({ cls: "folk-tune-review-score" });
    item.createEl("strong", { text: scoreCount.score.toString() });
    item.createEl("span", {
      text: `${scoreCount.count} ${scoreCount.count === 1 ? "tune" : "tunes"}`,
    });
  }

  private renderMostOverdueTune(
    container: HTMLElement,
    tune: MostOverdueTune,
  ): void {
    const item = container.createEl("li", {
      cls: "folk-tune-review-queue-item folk-tune-review-stats-overdue-item",
    });

    const link = item.createEl("a", {
      cls: "folk-tune-review-stats-overdue-link",
      href: tune.path,
    });
    link.addEventListener("click", (event) => {
      event.preventDefault();
      void this.openTune(tune);
    });

    link.createEl("h4", { text: tune.title });
    const metadata = link.createDiv({
      cls: "folk-tune-review-metadata",
    });
    this.renderMetadata(metadata, "Due", tune.dueDate);
    this.renderMetadata(metadata, "Overdue", `${tune.overdueDays} days`);
    this.renderMetadata(metadata, "Last score", tune.lastScore.toString());
  }

  private renderMetadata(
    container: HTMLElement,
    label: string,
    value: string,
  ): void {
    const row = container.createDiv({ cls: "folk-tune-review-metadata-row" });
    row.createEl("span", {
      cls: "folk-tune-review-metadata-label",
      text: `${label}:`,
    });
    row.createEl("span", { text: value });
  }
}
