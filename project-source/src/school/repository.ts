import type { DemoState, TariffId } from "./domain";
import { getTariff, lessons } from "./data";

interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export interface SchoolRepository {
  getSnapshot(): DemoState;
  subscribe(listener: () => void): () => void;
  enroll(tariff: TariffId, simulateError?: boolean): void;
  hasAccess(): boolean;
  markComplete(lessonId: string): void;
  savePosition(lessonId: string, second: number): void;
  ask(lessonId: string, question: string): void;
  reply(threadId: string, text: string): void;
  expire(): void;
  reset(): void;
}
const KEY = "practice-school-demo-v1";
const empty = (): DemoState => ({ version: 1, enrollment: null, progress: {}, threads: [] });
const lessonExists = (id: string) => lessons.some(l => l.id === id);

function restore(raw: string | null): DemoState {
  if (!raw) return empty();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return empty();
    const s = value as DemoState;
    if (s.version !== 1 || !s.progress || typeof s.progress !== "object" || Array.isArray(s.progress) || !Array.isArray(s.threads)) return empty();
    if (s.enrollment !== null && (!s.enrollment || !["self", "feedback"].includes(s.enrollment.tariff) ||
      !Number.isFinite(s.enrollment.expiresAt) || !Number.isFinite(s.enrollment.supportExpiresAt))) return empty();
    if (!Object.entries(s.progress).every(([id, p]) => lessonExists(id) && p && typeof p.completed === "boolean" && Number.isFinite(p.second) && p.second >= 0)) return empty();
    if (!s.threads.every(t => t && typeof t.id === "string" && lessonExists(t.lessonId) && typeof t.question === "string" &&
      Number.isFinite(t.createdAt) && (t.reply === undefined || typeof t.reply === "string"))) return empty();
    return s;
  } catch {
    return empty();
  }
}

export class DemoSchoolRepository implements SchoolRepository {
  private state: DemoState;
  private listeners = new Set<() => void>();
  persistenceAvailable = true;
  constructor(private storage?: StoragePort, private now = Date.now) {
    try {
      this.state = restore(storage?.getItem(KEY) ?? null);
    } catch {
      this.state = empty();
      this.persistenceAvailable = false;
    }
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private write(next: DemoState) {
    this.state = next;
    try {
      this.storage?.setItem(KEY, JSON.stringify(next));
    } catch {
      this.persistenceAvailable = false;
    }
    this.listeners.forEach(listener => listener());
  }
  hasAccess = () => !!this.state.enrollment && this.state.enrollment.expiresAt > this.now();
  enroll(tariff: TariffId, simulateError = false) {
    if (simulateError) throw new Error("Пробный сценарий ошибки. Деньги не списывались. Попробуйте ещё раз.");
    if (!["self", "feedback"].includes(tariff)) throw new Error("Неизвестный тариф.");
    const t = getTariff(tariff);
    this.write({ ...this.state, enrollment: {
      tariff, expiresAt: this.now() + t.days * 86400000,
      supportExpiresAt: this.now() + t.supportDays * 86400000,
    } });
  }
  private requireLesson(id: string) {
    if (!lessonExists(id)) throw new Error("Урок не найден.");
    if (!this.hasAccess()) throw new Error("Демо-доступ отсутствует или истёк.");
  }
  markComplete(id: string) {
    this.requireLesson(id);
    const current = this.state.progress[id] ?? { completed: false, second: 0 };
    this.write({ ...this.state, progress: { ...this.state.progress, [id]: { ...current, completed: !current.completed } } });
  }
  savePosition(id: string, second: number) {
    this.requireLesson(id);
    if (!Number.isFinite(second) || second < 0) return;
    const current = this.state.progress[id] ?? { completed: false, second: 0 };
    this.write({ ...this.state, progress: { ...this.state.progress, [id]: { ...current, second } } });
  }
  ask(id: string, question: string) {
    this.requireLesson(id);
    const e = this.state.enrollment!;
    const tariff = getTariff(e.tariff);
    if (!tariff.questions) throw new Error("Вопросы доступны на тарифе «Вместе с автором».");
    if (e.supportExpiresAt <= this.now()) throw new Error("Демонстрационный срок сопровождения истёк.");
    if (this.state.threads.length >= tariff.questions) throw new Error("Лимит демонстрационных вопросов исчерпан.");
    const text = question.trim();
    if (text.length < 10 || text.length > 2000) throw new Error("Введите вопрос от 10 до 2000 символов.");
    this.write({ ...this.state, threads: [...this.state.threads, {
      id: globalThis.crypto.randomUUID(), lessonId: id, question: text, createdAt: this.now(),
    }] });
  }
  reply(threadId: string, text: string) {
    if (!this.state.threads.some(t => t.id === threadId)) throw new Error("Вопрос не найден.");
    const reply = text.trim();
    if (!reply || reply.length > 4000) throw new Error("Ответ должен содержать от 1 до 4000 символов.");
    this.write({ ...this.state, threads: this.state.threads.map(t => t.id === threadId ? { ...t, reply } : t) });
  }
  expire() {
    if (this.state.enrollment) this.write({ ...this.state, enrollment: { ...this.state.enrollment, expiresAt: this.now() - 1 } });
  }
  reset() { this.write(empty()); }
}
