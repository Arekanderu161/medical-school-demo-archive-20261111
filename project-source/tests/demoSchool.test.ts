import { describe, expect, it } from "vitest";
import { DemoSchoolRepository } from "../src/school/repository";

function fixture() {
  const values = new Map<string, string>();
  const storage = { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); } };
  let now = 1000000;
  const repo = new DemoSchoolRepository(storage, () => now);
  return { repo, storage, advance: (days: number) => { now += days * 86400000; } };
}

describe("локальное демо школы, не production-авторизация", () => {
  it("не выдаёт доступ до оформления и при ошибке оформления", () => {
    const { repo } = fixture();
    expect(repo.hasAccess()).toBe(false);
    expect(() => repo.enroll("feedback", true)).toThrow("Деньги не списывались");
    expect(repo.hasAccess()).toBe(false);
    expect(() => repo.markComplete("anatomy")).toThrow("истёк");
  });
  it("сохраняет прогресс и позицию после перезагрузки", () => {
    const { repo, storage } = fixture();
    repo.enroll("self");
    repo.markComplete("anatomy");
    repo.savePosition("anatomy", 12);
    const restored = new DemoSchoolRepository(storage, () => 1000000);
    expect(restored.getSnapshot().progress.anatomy).toEqual({ completed: true, second: 12 });
    repo.markComplete("anatomy");
    expect(repo.getSnapshot().progress.anatomy.completed).toBe(false);
    expect(() => repo.markComplete("missing")).toThrow("не найден");
    repo.savePosition("anatomy", NaN);
    expect(repo.getSnapshot().progress.anatomy.second).toBe(12);
  });
  it("различает тарифы и отвечает только на выбранный вопрос", () => {
    const { repo } = fixture();
    repo.enroll("self");
    expect(() => repo.ask("anatomy", "Как устроен этот пример урока?")).toThrow("тарифе");
    repo.enroll("feedback");
    repo.ask("anatomy", "Как устроен этот пример урока?");
    repo.ask("protocol", "Где найти материалы этого урока?");
    repo.reply(repo.getSnapshot().threads[1].id, "Материалы расположены под уроком.");
    expect(repo.getSnapshot().threads[0].reply).toBeUndefined();
    expect(repo.getSnapshot().threads[1].reply).toContain("под уроком");
    expect(() => repo.reply("missing", "Ответ")).toThrow("не найден");
  });
  it("проверяет лимит, сроки сопровождения и доступа", () => {
    const { repo, advance } = fixture();
    repo.enroll("feedback");
    expect(() => repo.ask("anatomy", "Коротко")).toThrow("10");
    for (let i = 0; i < 5; i++) repo.ask("anatomy", `Вопрос по демонстрации номер ${i}`);
    expect(() => repo.ask("anatomy", "Ещё один демонстрационный вопрос")).toThrow("Лимит");
    repo.reset();
    repo.enroll("feedback");
    advance(31);
    expect(repo.hasAccess()).toBe(true);
    expect(() => repo.ask("anatomy", "Вопрос по демонстрации курса")).toThrow("сопровождения");
    advance(150);
    expect(repo.hasAccess()).toBe(false);
  });
  it("сбрасывает только данные школы", () => {
    const { repo, storage } = fixture();
    storage.setItem("another-app", "keep");
    repo.enroll("feedback");
    repo.ask("anatomy", "Пример вопроса для сброса");
    repo.reset();
    expect(repo.getSnapshot()).toEqual({ version: 1, enrollment: null, progress: {}, threads: [] });
    expect(storage.getItem("another-app")).toBe("keep");
  });
  it("восстанавливается после повреждённых данных и работает без хранилища", () => {
    for (const raw of ["{broken", '{"version":2}', '{"version":1,"enrollment":null,"progress":[],"threads":[]}']) {
      const repo = new DemoSchoolRepository({ getItem: () => raw, setItem: () => {} });
      expect(repo.hasAccess()).toBe(false);
    }
    const repo = new DemoSchoolRepository({ getItem: () => { throw Error(); }, setItem: () => { throw Error(); } });
    repo.enroll("self");
    expect(repo.hasAccess()).toBe(true);
    expect(repo.persistenceAvailable).toBe(false);
  });
  it("уведомляет подписчиков и позволяет показать истечение доступа", () => {
    const { repo } = fixture();
    let calls = 0;
    const off = repo.subscribe(() => calls++);
    repo.enroll("self");
    repo.expire();
    expect(repo.hasAccess()).toBe(false);
    expect(calls).toBe(2);
    off();
    repo.reset();
    expect(calls).toBe(2);
  });
});
