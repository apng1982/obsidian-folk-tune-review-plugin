import type { Tune } from "../domain/tune";

export interface NoteContent {
  readonly markdown: string;
  readonly sourcePath: string;
  readonly title: string;
}

export interface NoteReader {
  readTune(tune: Tune): Promise<NoteContent>;
}
