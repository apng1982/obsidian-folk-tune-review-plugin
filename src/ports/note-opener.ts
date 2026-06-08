import type { Tune } from "../domain/tune";

export interface NoteOpener {
  openTune(tune: Tune): Promise<void>;
}
