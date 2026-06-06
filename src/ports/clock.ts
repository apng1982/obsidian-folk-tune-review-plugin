import type { LocalDate } from "../domain/dates";

export interface Clock {
  today(): LocalDate;
}
