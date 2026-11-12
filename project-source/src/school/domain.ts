export type TariffId = "self" | "feedback";
export interface Lesson {
  id: string;
  module: string;
  title: string;
  description: string;
  minutes: number;
  topics: string[];
}
export interface Tariff {
  id: TariffId;
  title: string;
  price: number;
  days: number;
  questions: number;
  supportDays: number;
  features: string[];
}
export interface Thread {
  id: string;
  lessonId: string;
  question: string;
  createdAt: number;
  reply?: string;
}
export interface DemoState {
  version: 1;
  enrollment: { tariff: TariffId; expiresAt: number; supportExpiresAt: number } | null;
  progress: Record<string, { completed: boolean; second: number }>;
  threads: Thread[];
}
