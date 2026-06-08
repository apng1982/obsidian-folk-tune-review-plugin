import type { Tune } from "../domain/tune";

export interface TuneRepository {
  getTunes(): Promise<Tune[]>;
}
