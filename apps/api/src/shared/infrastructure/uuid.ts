// UUIDv7 генератор (ADR-005): сортируемые по времени id.
// npm i uuidv7
import { uuidv7 } from 'uuidv7';

export const newId = (): string => uuidv7();
