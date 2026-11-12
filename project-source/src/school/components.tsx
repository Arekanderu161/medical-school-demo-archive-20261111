import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, FileText, Pause, Play, RotateCcw, Maximize2 } from "lucide-react";
import { getTariff, money, tariffs } from "./data";
import type { Lesson, TariffId } from "./domain";

export function OrganArt({ small = false }: { small?: boolean }) {
  return <svg viewBox="0 0 560 440" className={small ? "organ-art small" : "organ-art"} aria-hidden="true">
    <defs>
      <linearGradient id={small ? "lobes-small" : "lobes"} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#edb99f" /><stop offset=".5" stopColor="#d48b73" /><stop offset="1" stopColor="#995851" />
      </linearGradient>
      <pattern id={small ? "dots-small" : "dots"} width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#fff" opacity=".22" /></pattern>
    </defs>
    <circle cx="280" cy="221" r="167" fill="none" stroke="#d3dcd3" />
    <circle cx="280" cy="221" r="134" fill="none" stroke="#d3dcd3" strokeDasharray="3 8" />
    <path d="M280 38V403M74 221H486" stroke="#ccd7cd" strokeDasharray="4 8" />
    <g fill="none" stroke="#8ba394" opacity=".48">
      <path d="M256 80V350Q280 370 304 350V80" strokeWidth="2" />
      {[110, 130, 150, 170, 190, 210, 230, 250, 270, 290, 310, 330].map(y => <path key={y} d={`M257 ${y} Q280 ${y + 10} 303 ${y}`} />)}
    </g>
    <g fill={`url(#${small ? "lobes-small" : "lobes"})`} stroke="#bc7c68" strokeWidth="1">
      <path d="M257 233C250 200 245 97 203 103C160 108 133 173 143 240C149 287 175 334 205 319C224 308 226 274 257 263Z" />
      <path d="M303 233C310 200 315 97 357 103C400 108 427 173 417 240C411 287 385 334 355 319C336 308 334 274 303 263Z" />
      <path d="M241 232Q280 254 319 232L324 264Q280 282 236 264Z" />
    </g>
    <g fill={`url(#${small ? "dots-small" : "dots"})`}>
      <ellipse cx="198" cy="215" rx="45" ry="90" transform="rotate(8 198 215)" />
      <ellipse cx="362" cy="215" rx="45" ry="90" transform="rotate(-8 362 215)" />
    </g>
    <g stroke="#f9dfca" fill="none" strokeWidth="1.4" opacity=".5">
      <path d="M200 125Q170 203 200 296M185 151L209 175L175 205L215 234L190 275M360 125Q390 203 360 296M375 151L351 175L385 205L345 234L370 275" />
    </g>
    <g stroke="#7a9283" fill="#7a9283"><path d="M153 165H87V134" fill="none" /><circle cx="153" cy="165" r="3" /><path d="M408 278H478V309" fill="none" /><circle cx="408" cy="278" r="3" /></g>
    <text x="66" y="119" fill="#6e8177" fontSize="10" letterSpacing="2">АНАТОМИЯ</text>
    <text x="426" y="329" fill="#6e8177" fontSize="10" letterSpacing="2">ПРАКТИКА</text>
  </svg>;
}

export function TariffCards() {
  return <div className="tariff-grid">{tariffs.map(t => <article className={`tariff-card ${t.id === "feedback" ? "featured" : ""}`} key={t.id}>
    <div className="eyebrow">{t.id === "self" ? "В удобном темпе" : "С обратной связью"}</div>
    <h3>{t.title}</h3><p>{t.id === "self" ? "Системное обучение и материалы, к которым можно вернуться." : "Та же программа — с возможностью задать вопрос автору."}</p>
    <div className="price">{money(t.price)}<span>пример стоимости</span></div>
    <ul className="checks">{t.features.map(f => <li key={f}><Check size={16} />{f}</li>)}<li><Check size={16} />Доступ {t.days} дней</li></ul>
    <a className={`button ${t.id === "feedback" ? "" : "secondary"}`} href={`#/checkout/${t.id}`}>Выбрать тариф <ArrowRight size={17} /></a>
  </article>)}</div>;
}

export function HandoutLink() {
  return <a className="handout-card" href="#/handout"><span className="icon-square"><FileText size={23} /></span>
    <span><strong>Пособие к курсу</strong><small>Пример · печать и сохранение в PDF</small></span><ArrowRight size={19} /></a>;
}

export function DemoPlayer({ lesson, position, save }: { lesson: Lesson; position: number; save: (s: number) => void }) {
  const [playing, setPlaying] = useState(false);
  const [seconds, setSeconds] = useState(position);
  const [error, setError] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const frame = useRef<HTMLDivElement>(null);
  const current = useRef(position);
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const flush = () => saveRef.current(current.current);
    window.addEventListener("pagehide", flush);
    return () => { flush(); window.removeEventListener("pagehide", flush); };
  }, []);
  useEffect(() => {
    if (!playing || error) return;
    const timer = window.setInterval(() => {
      setSeconds(s => {
        const next = Math.min(60, s + 1);
        current.current = next;
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing, error]);
  useEffect(() => {
    if (seconds === 60) setPlaying(false);
    if (seconds % 5 === 0) saveRef.current(seconds);
  }, [seconds]);
  const slide = Math.min(2, Math.floor(seconds / 20));
  return <><div className="demo-player" ref={frame}>
    <div className="player-top"><span>ПРАКТИКА / ПРИМЕР УРОКА</span><span>DEMO · 001</span></div>
    {error ? <div className="player-error" role="alert"><h3>Пример недоступен</h3><p>Это демонстрационный сценарий ошибки загрузки.</p><button className="button light" onClick={() => setError(false)}><RotateCcw size={16} />Повторить</button></div> :
      <div className="slide-content"><span className="eyebrow">Слайд {slide + 1} из 3</span><h2>{lesson.topics[slide]}</h2><p>Здесь будет видеолекция автора.<br />Сейчас — интерактивный пример интерфейса.</p><span className="slide-line" /></div>}
    <span className="player-watermark">Демо-лицензия D-001 · пример маркировки</span>
    <div className="player-controls">
      <button aria-label={playing ? "Пауза" : "Запустить пример"} disabled={error} onClick={() => { if (seconds >= 60) { setSeconds(0); current.current = 0; } setPlaying(!playing); }}>{playing ? <Pause size={19} /> : <Play size={19} />}</button>
      <span>{`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`} / 1:00</span>
      <input type="range" aria-label="Позиция демонстрационного урока" min="0" max="60" value={seconds} disabled={error}
        onChange={e => { const s = Number(e.target.value); current.current = s; setSeconds(s); save(s); }} />
      <button aria-label="Полноэкранный режим" onClick={async () => {
        try { if (document.fullscreenElement) await document.exitFullscreen(); else if (frame.current?.requestFullscreen) await frame.current.requestFullscreen(); else setFullscreenError("Браузер не поддерживает полноэкранный режим."); }
        catch { setFullscreenError("Полноэкранный режим недоступен в этом браузере."); }
      }}><Maximize2 size={19} /></button>
    </div>
  </div><div className="player-disclaimer"><span>Интерактивный макет, не медицинская лекция. DRM не подключён.</span>
    <button className="text-button" onClick={() => { setPlaying(false); setError(true); }}>Проверить ошибку</button></div>
    {fullscreenError && <p role="status">{fullscreenError}</p>}</>;
}

export function EnrollmentSummary({ tariff }: { tariff: TariffId }) {
  const t = getTariff(tariff);
  return <><span className="eyebrow">Выбранный тариф</span><h2>{t.title}</h2><div className="price">{money(t.price)}<span>демонстрационная цена, без списания</span></div>
    <ul className="checks">{t.features.map(f => <li key={f}><Check size={16} />{f}</li>)}<li><Check size={16} />Доступ {t.days} дней</li></ul></>;
}
