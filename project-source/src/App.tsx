import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Clock3, FileText, GraduationCap, Layers3, LockKeyhole, MessageCircle, RotateCcw, Stethoscope } from "lucide-react";
import { course, getTariff, lessons, totalMinutes } from "./school/data";
import { DemoSchoolRepository } from "./school/repository";
import type { DemoState, Lesson, TariffId, Thread } from "./school/domain";
import { DemoPlayer, EnrollmentSummary, HandoutLink, OrganArt, TariffCards } from "./school/components";

const storage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
};
const repo = new DemoSchoolRepository(storage);
const routeSnapshot = () => window.location.hash || "#/course";
const subscribeRoute = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};
const navigate = (path: string) => { window.location.hash = path; };
const date = (timestamp: number) => new Date(timestamp).toLocaleDateString("ru-RU");

export default function App() {
  const route = useSyncExternalStore(subscribeRoute, routeSnapshot);
  const state = useSyncExternalStore(repo.subscribe, repo.getSnapshot);
  const main = useRef<HTMLElement>(null);
  const previousRoute = useRef(route);
  const [, tick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => tick(t => t + 1), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (previousRoute.current !== route) main.current?.focus();
    previousRoute.current = route;
    document.title = `${route.startsWith("#/lesson") ? "Урок" : route === "#/learning" ? "Моё обучение" : "Школа УЗИ"} · Практика`;
  }, [route]);
  const active = repo.hasAccess();
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const landing = route === "#/course" || route === "#/";
  return <>
    <button className="skip-link" onClick={() => main.current?.focus()}>Перейти к содержимому</button>
    <div className="demo-banner"><span className="demo-dot" /><strong>{import.meta.env.VITE_DEMO_LABEL || "Демонстрация школы"}</strong><span>Без реальных оплат и персональных данных</span></div>
    <header className="site-header"><div className="container header-inner">
      <a href="#/course" className="brand" aria-label="Практика — главная"><span className="brand-mark"><Stethoscope size={24} /></span><span>практика<small>школа ультразвуковой диагностики</small></span></a>
      <nav aria-label="Основная навигация">
        <a href="#/course" aria-current={landing ? "page" : undefined}>О курсе</a>
        <a href="#/learning" aria-current={route === "#/learning" ? "page" : undefined}>Моё обучение</a>
        <a href="#/author" aria-current={route === "#/author" ? "page" : undefined}>Режим автора <span className="tiny-badge">демо</span></a>
      </nav>
      <a href={active ? "#/learning" : "#/checkout/self"} className="header-cta">{active ? "В кабинет" : "Попробовать демо"}<ArrowRight size={16} /></a>
    </div></header>
    <main id="main" tabIndex={-1} ref={main}>
      {landing ? <Landing /> :
        route.startsWith("#/checkout/") ? <Checkout tariff={route.split("/")[2]} /> :
        route === "#/learning" ? <Learning state={state} active={active} /> :
        route.startsWith("#/lesson/") ? <LessonPage lessonId={route.split("/")[2]} state={state} active={active} /> :
        route === "#/author" ? <AuthorPage threads={state.threads} /> :
        route === "#/handout" ? <Handout /> :
        <section className="container empty-state"><BookOpen size={32} /><h1>Страница не найдена</h1><a className="button" href="#/course">К странице курса</a></section>}
    </main>
    <footer className="site-footer container"><div className="footer-top"><span className="brand-word">практика<span> / </span></span><p>Знания, которые становятся<br />частью вашей практики.</p></div>
      <div className="footer-bottom"><span>Прототип школы · содержание и условия предварительные</span><button className="text-button" onClick={() => setResetOpen(!resetOpen)}><RotateCcw size={13} />Сбросить демо</button></div>
      {resetOpen && <div className="reset-confirm" role="group" aria-label="Подтверждение сброса"><p>Удалить локальный демо-доступ, прогресс и вопросы? Другие данные браузера не затрагиваются.</p><button className="button small-button" onClick={() => { repo.reset(); setResetOpen(false); setNotice("Демо сброшено."); navigate("/course"); }}>Да, сбросить</button><button className="text-button" onClick={() => setResetOpen(false)}>Отмена</button></div>}
      <p role="status" className="footer-status">{notice}</p>
      {!repo.persistenceAvailable && <p role="status">Браузер запретил сохранение. Демо работает до закрытия страницы.</p>}
    </footer>
  </>;
}

function Landing() {
  return <>
    <section className="hero container">
      <div className="hero-copy"><div className="eyebrow"><span className="line" />Онлайн-курс для врачей УЗД</div>
        <h1>Щитовидная<br />железа.<br /><em>Уверенность<br className="mobile-break" /> в деталях.</em></h1>
        <p className="hero-description">{course.description}</p>
        <div className="hero-actions"><button className="button" onClick={() => document.getElementById("tariffs")?.scrollIntoView({ behavior: "smooth" })}>Выбрать формат обучения<ArrowRight size={18} /></button>
          <button className="text-button" onClick={() => document.getElementById("program")?.scrollIntoView({ behavior: "smooth" })}>Программа курса<ArrowDown size={16} /></button></div>
        <p className="fine-print">Предварительная программа · интерактивное демо</p>
      </div>
      <div className="hero-visual"><div className="visual-heading"><span>АТЛАС ЗНАНИЙ</span><span>01 / THYROID</span></div><OrganArt />
        <div className="visual-note"><span className="note-index">01</span><div><strong>Сначала — целостная картина.</strong><p>Затем — внимание к каждому ориентиру.</p></div></div>
        <span className="art-caption">Декоративная схема, не диагностическое изображение</span></div>
    </section>
    <section className="container facts-row" aria-label="Предварительный формат"><div><Layers3 size={22} /><strong>3 модуля<span>от основы к практике</span></strong></div><div><BookOpen size={22} /><strong>{lessons.length} уроков<span>пример структуры курса</span></strong></div><div><FileText size={22} /><strong>Печатные пособия<span>важное — под рукой</span></strong></div><div><Clock3 size={22} /><strong>В своём темпе<span>с компьютера и телефона</span></strong></div></section>
    <section className="section container approach" id="approach"><div><span className="eyebrow">Понимать, а не запоминать</span><h2>От отдельных находок —<br /><em>к системному подходу.</em></h2></div><div><p>Курс задуман как последовательный маршрут: разобраться в основе, упорядочить наблюдения и собрать их в понятное заключение.</p><p className="muted">Здесь показан формат будущей школы. Программа пройдёт медицинскую редактуру, а уроки и клинические кейсы добавит автор.</p></div></section>
    <section className="section program-section" id="program"><div className="container"><div className="section-heading"><div><span className="eyebrow">Ваш маршрут обучения</span><h2>Всё начинается с основы.</h2></div><span className="section-note">3 модуля · {lessons.length} уроков<br />{totalMinutes} минут — примерный объём</span></div>
      <div className="module-list">{[...new Set(lessons.map(l => l.module))].map(module => <details key={module} open><summary><span className="module-number">{module.slice(0, 2)}</span><span>{module.slice(5)}</span><span className="module-count">{lessons.filter(l => l.module === module).length} урока</span><ChevronRight size={19} /></summary>
        <div className="module-lessons">{lessons.filter(l => l.module === module).map(l => <div key={l.id}><span><span className="lesson-dot" />{l.title}</span><span>{l.minutes} мин</span></div>)}</div></details>)}</div>
    </div></section>
    <section className="section container materials-section"><div className="paper-stack"><div className="paper-sheet"><span className="eyebrow">Практика / материалы курса</span><h3>Главное —<br />на одном листе.</h3><div className="paper-rule" />{["Структура исследования", "Система наблюдений", "Вопросы для самопроверки"].map((s, i) => <div className="paper-item" key={s}><span>0{i + 1}</span>{s}</div>)}<span className="paper-watermark">ДЕМО-ЛИЦЕНЗИЯ D-001</span></div></div>
      <div><span className="eyebrow">Не только видеолекции</span><h2>Знания остаются<br /><em>с вами.</em></h2><p>Пособия можно распечатать и держать рядом. Без поиска нужного момента в длинной записи.</p><HandoutLink /><p className="fine-print">В демо — пример оформления без клинических рекомендаций.</p></div></section>
    <section className="section author-section"><div className="container author-grid"><div className="author-placeholder"><GraduationCap size={56} strokeWidth={1} /><span>МЕСТО ДЛЯ ФОТО АВТОРА</span></div><div><span className="eyebrow">Обучение от практика</span><h2>За каждым уроком —<br /><em>опыт автора.</em></h2><p>Здесь появятся имя, профессиональная биография и подход преподавателя к обучению.</p><p className="muted">Мы не добавляем вымышленные регалии и отзывы. Этот блок заполняется после согласования с автором курса.</p></div></div></section>
    <section className="section container" id="tariffs"><div className="section-heading"><div><span className="eyebrow">Два способа пройти один путь</span><h2>Выберите свой формат.</h2></div><p className="section-note">Цены и сроки приведены для примера.<br />Реальная продажа не подключена.</p></div><TariffCards /></section>
    <section className="container faq-section"><h2>Перед началом</h2>{[
      ["Это уже готовый медицинский курс?", "Нет. Это интерактивный прототип школы. Программа предварительная, авторские видеолекции и медицинские материалы ещё не загружены."],
      ["Можно ли учиться с телефона?", "Да. Макет адаптирован для браузера телефона, планшета и компьютера. Telegram не нужен."],
      ["Как устроена защита материалов?", "В демо показан только пример маркировки. Для запуска отдельно подключаются серверные права и видеохостинг. Полной защиты от копирования не существует."],
    ].map(([q, a]) => <details key={q}><summary>{q}<ChevronRight size={18} /></summary><p>{a}</p></details>)}</section>
  </>;
}

function Checkout({ tariff }: { tariff: string }) {
  const [error, setError] = useState("");
  const [simulateError, setSimulateError] = useState(false);
  if (tariff !== "self" && tariff !== "feedback") return <Empty title="Тариф не найден" />;
  return <section className="container section checkout"><a href="#/course" className="back-link"><ArrowLeft size={16} />К странице курса</a><div className="section-heading"><div><span className="eyebrow">Посмотрите, как всё устроено</span><h1>Ваш первый шаг<br /><em>к обучению.</em></h1></div></div>
    <div className="checkout-grid"><article className="panel"><span className="tag">Демонстрационное оформление</span><h2>Откройте кабинет ученика</h2><p>Используем вымышленную учётную запись «Демо-ученик». Email не запрашивается, письма не отправляются.</p><div className="demo-person"><span className="avatar">ДУ</span><div><strong>Демо-ученик</strong><small>Только локально в этом браузере</small></div></div>
      <div className="notice"><LockKeyhole size={19} /><span>Это не покупка. Банковские данные не нужны, деньги не списываются. Условия курса предварительные.</span></div>
      <label className="checkbox"><input type="checkbox" checked={simulateError} onChange={e => setSimulateError(e.target.checked)} />Показать ошибку оформления</label>
      {error && <p role="alert" className="error-message">{error}</p>}
      <button className="button" onClick={() => { try { repo.enroll(tariff, simulateError); navigate("/learning"); } catch (e) { setError((e as Error).message); } }}>Открыть демо-доступ<ArrowRight size={18} /></button>
      <p className="fine-print">В рабочей версии здесь появятся вход по email и оплата.</p>
    </article><aside className="tariff-card"><EnrollmentSummary tariff={tariff} /><a className="text-button" href={`#/checkout/${tariff === "self" ? "feedback" : "self"}`}>Посмотреть другой тариф<ArrowRight size={16} /></a></aside></div>
  </section>;
}

function Empty({ title, description = "Начните со страницы курса и выберите демонстрационный тариф." }: { title: string; description?: string }) {
  return <section className="container section empty-state"><span className="icon-square"><BookOpen size={28} /></span><h1>{title}</h1><p>{description}</p><a href="#/course" className="button">Посмотреть курс<ArrowRight size={17} /></a></section>;
}

function Learning({ state, active }: { state: DemoState; active: boolean }) {
  if (!active) return <Empty title={state.enrollment ? "Демо-доступ истёк" : "Ваше обучение начинается здесь"} description={state.enrollment ? "Откройте демо-доступ заново. Прогресс сохранится в этом браузере." : undefined} />;
  const completed = lessons.filter(l => state.progress[l.id]?.completed).length;
  const next = lessons.find(l => !state.progress[l.id]?.completed) ?? lessons[0];
  const t = getTariff(state.enrollment!.tariff);
  return <section className="container section"><div className="section-heading"><div><span className="eyebrow">Личный кабинет / демо-ученик</span><h1>Продолжим <em>практику.</em></h1></div><span className="tag">Тариф «{t.title}»</span></div>
    <article className="learning-card"><div className="learning-art"><OrganArt small /></div><div><span className="eyebrow">Ваш курс</span><h2>{course.title}</h2><p>{course.subtitle}</p><div className="progress-label"><span>Пройдено {completed} из {lessons.length} уроков</span><strong>{Math.round(completed / lessons.length * 100)}%</strong></div><progress value={completed} max={lessons.length} aria-label="Прогресс курса" /><a className="button" href={`#/lesson/${next.id}`}>{completed === lessons.length ? "Повторить материал" : "Продолжить обучение"}<ArrowRight size={18} /></a><small className="access-date">Демо-доступ до {date(state.enrollment!.expiresAt)}</small></div></article>
    <div className="dashboard-grid"><div><h2>Уроки курса</h2><div className="lesson-directory">{lessons.map((l, i) => <a href={`#/lesson/${l.id}`} key={l.id}><span className={`lesson-index ${state.progress[l.id]?.completed ? "done" : ""}`}>{state.progress[l.id]?.completed ? <Check size={16} /> : String(i + 1).padStart(2, "0")}</span><span><small>{l.module}</small><strong>{l.title}</strong></span><span className="lesson-duration">{l.minutes} мин</span><ChevronRight size={18} /></a>)}</div></div>
      <aside><h2>Под рукой</h2><HandoutLink /><div className="panel compact-panel"><MessageCircle size={24} /><h3>Обратная связь</h3><p>{t.questions ? `До ${t.questions} вопросов, сопровождение до ${date(state.enrollment!.supportExpiresAt)}.` : "На этом тарифе вопросы автору не предусмотрены."}</p>{!t.questions && <a href="#/checkout/feedback" className="text-button">Посмотреть расширенный тариф<ArrowRight size={15} /></a>}</div>
        <details className="demo-tools"><summary>Сценарии демонстрации</summary><button className="text-button" onClick={() => repo.expire()}>Показать истечение доступа</button></details></aside></div>
  </section>;
}

function LessonPage({ lessonId, state, active }: { lessonId: string; state: DemoState; active: boolean }) {
  const lesson = lessons.find(l => l.id === lessonId);
  if (!lesson) return <Empty title="Урок не найден" />;
  if (!active) return <Empty title="Нужен демо-доступ" description="Этот урок доступен после выбора тарифа. Реальная покупка не требуется." />;
  const index = lessons.indexOf(lesson);
  return <section className="container section lesson-layout"><aside className="lesson-sidebar"><a className="back-link" href="#/learning"><ArrowLeft size={15} />Моё обучение</a><h3>{course.title}</h3><p className="fine-print">Программа курса</p>{lessons.map((l, i) => <a className={l.id === lessonId ? "selected" : ""} href={`#/lesson/${l.id}`} key={l.id} aria-current={l.id === lessonId ? "page" : undefined}><span>{state.progress[l.id]?.completed ? <CheckCircle2 size={16} /> : `0${i + 1}`}</span>{l.title}</a>)}</aside>
    <div className="lesson-main"><span className="eyebrow">{lesson.module} / урок {index + 1}</span><h1>{lesson.title}</h1><p className="muted">{lesson.description}</p>
      <DemoPlayer key={lesson.id} lesson={lesson} position={Math.min(60, state.progress[lesson.id]?.second ?? 0)} save={second => { if (repo.hasAccess()) repo.savePosition(lesson.id, second); }} />
      <div className="lesson-actions"><button className={`button ${state.progress[lesson.id]?.completed ? "secondary" : ""}`} onClick={() => repo.markComplete(lesson.id)}><Check size={17} />{state.progress[lesson.id]?.completed ? "Урок пройден · отменить" : "Отметить как пройденный"}</button>{index < lessons.length - 1 && <a className="text-button" href={`#/lesson/${lessons[index + 1].id}`}>Следующий урок<ArrowRight size={16} /></a>}</div>
      <HandoutLink /><Feedback key={lesson.id} lesson={lesson} state={state} />
    </div></section>;
}

function Feedback({ lesson, state }: { lesson: Lesson; state: DemoState }) {
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState("");
  const tariff = getTariff(state.enrollment!.tariff);
  const threads = state.threads.filter(t => t.lessonId === lesson.id);
  const remaining = Math.max(0, tariff.questions - state.threads.length);
  const supportActive = state.enrollment!.supportExpiresAt > Date.now();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    try { repo.ask(lesson.id, question); setQuestion(""); setMessage("Вопрос сохранён локально. Перейдите в режим автора, чтобы ответить."); }
    catch (error) { setMessage((error as Error).message); }
  };
  return <section className="feedback-section"><div className="section-heading"><h2>Вопрос по уроку</h2><MessageCircle size={22} /></div>
    {!tariff.questions ? <div className="notice"><LockKeyhole size={20} /><div><p>Обратная связь включена в тариф «Вместе с автором».</p><a className="text-button" href="#/checkout/feedback">Посмотреть тариф<ArrowRight size={15} /></a></div></div> :
      <form onSubmit={submit}><p className="muted">Осталось вопросов: {remaining} из {tariff.questions}. Только вымышленные примеры, без данных пациентов.</p><label htmlFor="question">Ваш вопрос</label><textarea id="question" minLength={10} maxLength={2000} required rows={4} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Например: где найти материалы к этому уроку?" disabled={!supportActive || !remaining} /><div className="form-bottom"><button className="button small-button" disabled={!supportActive || !remaining}>Сохранить демо-вопрос<ArrowRight size={16} /></button><span className="fine-print">{supportActive ? `${question.length}/2000` : "Срок сопровождения истёк"}</span></div></form>}
    <p role="status" className="form-status">{message}</p>
    {threads.map(t => <ThreadView key={t.id} thread={t} />)}
  </section>;
}

function ThreadView({ thread }: { thread: Thread }) {
  return <article className="thread"><div className="thread-meta"><strong>Демо-ученик</strong><span>{date(thread.createdAt)} · {thread.reply ? "Есть ответ" : "Ожидает ответа"}</span></div><p>{thread.question}</p>{thread.reply && <div className="teacher-reply"><span className="eyebrow">Автор / демонстрационный ответ</span><p>{thread.reply}</p></div>}</article>;
}

function AuthorPage({ threads }: { threads: Thread[] }) {
  return <section className="container section"><div className="section-heading"><div><span className="eyebrow">Демонстрационный режим автора</span><h1>Вопросы, требующие<br /><em>вашего внимания.</em></h1></div><span className="tag">{threads.filter(t => !t.reply).length} без ответа</span></div><div className="notice"><GraduationCap size={23} /><span>Это открытый макет кабинета, не административная авторизация. Ответы сохраняются только в текущем браузере.</span></div>
    <div className="dashboard-grid"><div>{threads.length ? threads.map(t => <ReplyForm key={t.id} thread={t} />) : <div className="panel empty-state"><MessageCircle size={30} /><h2>Пока без вопросов</h2><p>Откройте демо-доступ «Вместе с автором» и задайте вопрос под уроком.</p><a href="#/checkout/feedback" className="button">Открыть демо ученика<ArrowRight size={16} /></a></div>}</div><aside className="panel compact-panel"><span className="eyebrow">Структура курса</span><h3>{course.title}</h3>{lessons.map(l => <div className="author-lesson" key={l.id}><BookOpen size={15} />{l.title}</div>)}<p className="fine-print">Редактор курса и загрузка материалов появятся после согласования демо.</p></aside></div>
  </section>;
}

function ReplyForm({ thread }: { thread: Thread }) {
  const [text, setText] = useState(thread.reply ?? "");
  const [message, setMessage] = useState("");
  return <article className="panel reply-panel"><span className="eyebrow">{lessons.find(l => l.id === thread.lessonId)?.title}</span><ThreadView thread={thread} /><form onSubmit={e => { e.preventDefault(); try { repo.reply(thread.id, text); setMessage("Демонстрационный ответ сохранён."); } catch (error) { setMessage((error as Error).message); } }}><label htmlFor={`reply-${thread.id}`}>Ответ автора</label><textarea id={`reply-${thread.id}`} rows={3} required maxLength={4000} value={text} onChange={e => setText(e.target.value)} placeholder="Напишите демонстрационный ответ..." /><button className="button small-button">{thread.reply ? "Обновить ответ" : "Сохранить ответ"}<ArrowRight size={16} /></button><p role="status">{message}</p></form></article>;
}

function Handout() {
  const [printMessage, setPrintMessage] = useState("");
  return <section className="container section handout-page"><div className="no-print"><a href="#/learning" className="back-link"><ArrowLeft size={16} />К обучению</a><div className="section-heading"><div><span className="eyebrow">Пример оформления</span><h1>Главное — <em>под рукой.</em></h1></div><button className="button" onClick={() => { window.print(); setPrintMessage("В диалоге печати можно выбрать «Сохранить как PDF»."); }}><FileText size={18} />Печать / сохранить PDF</button></div><p className="muted">Публичный образец. Сохранение в PDF выполняется средствами браузера; персональная серверная маркировка не подключена.</p><p role="status">{printMessage}</p></div>
    <article className="print-sheet"><div className="print-heading"><span className="brand-word">практика</span><span>ДЕМО · 01</span></div><span className="eyebrow">Щитовидная железа / пример пособия</span><h2>Структура работы<br />с материалами курса</h2><p>Образец вёрстки для согласования. Не содержит клинических рекомендаций и не предназначен для принятия медицинских решений.</p>{[
      ["01", "До урока", "Ознакомьтесь с темой и сформулируйте вопросы, которые хотите прояснить."],
      ["02", "Во время просмотра", "Записывайте ключевые понятия и отмечайте фрагменты, к которым нужно вернуться."],
      ["03", "После урока", "Проверьте конспект, повторите материал и задайте вопрос в пределах выбранного тарифа."],
    ].map(([n, title, text]) => <div className="print-item" key={n}><span>{n}</span><div><h3>{title}</h3><p>{text}</p></div></div>)}<h3>Мои заметки</h3><div className="note-lines" /><div className="print-footer">Демо-лицензия D-001 · вымышленный ученик<br />Пример маркировки, не защищённый учебный материал</div></article>
  </section>;
}
