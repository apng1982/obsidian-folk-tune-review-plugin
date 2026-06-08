import { formatLocalDate, type LocalDate } from "../domain/dates";
import type { Clock } from "../ports/clock";

export class SystemClock implements Clock {
  today(): LocalDate {
    return formatLocalDate(new Date());
  }
}
