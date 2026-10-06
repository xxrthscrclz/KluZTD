import type { AppData } from '@/types/task';

export type RemoteData = AppData & {
  rev: number;
  savedAt: string | null;
};

export type SaveRequest = AppData & {
  baseRev: number;
};

export type SaveResponse = {
  rev: number;
  savedAt: string;
};

export type RevEvent = {
  rev: number;
  clientId: string | null;
};
