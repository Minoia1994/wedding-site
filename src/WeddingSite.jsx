import React, { useMemo, useState } from 'react';
import BubbleBackground from './BubbleBackground';

export default function WeddingSite() {
  // === SETTINGS YOU CAN TUNE ===
  const FADE_MS = 1200;     // crossfade speed
  const SHOW_MS = 7000;     // time each slide stays fully visible
  const BG_OPACITY = 0.25;  // 0 = invisible, 1 = fully visible (softened)
  const BG_BLUR_PX = 3;     // slight blur keeps text legible

  // ADD/EDIT YOUR MEDIA HERE (point to files in /public/photos)
  // type: 'image' | 'video'
  const media = useMemo(
    () => [
      { type: 'image', src: '/photos/one.jpg' },
      { type: 'image', src: '/photos/two.jpg' },
      { type: 'video', src: '/photos/three.mp4' },
      // { type: 'image', src: '/photos/four.jpg' },
    ],
    []
  );

  // === STATE ===
  const [step, setStep] = useState('iframe'); // 'iframe' | 'sorry' | 'main'
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [attending, setAttending] = useState(null);
  const [language, setLanguage] = useState('en');
  // idx state and crossfade handled by BubbleBackground; remove unused state

  const t = {
    en: {
      title: 'RSVP',
      intro: 'Please confirm your attendance to access the wedding website.',
      name: 'Name',
      surname: 'Surname',
      attendance: 'Will you be attending?',
      selectOption: 'Select an option',
      yes: 'Yes, I’ll be there',
      no: 'No, sadly can’t make it',
      continue: 'Continue',
      sorryTitle: 'We’re sorry you can’t make it',
      sorryMsg: (n, s) =>
        `Thank you for letting us know, ${n} ${s}. You’ll be missed on our special day, but we’ll be thinking of you.`,
    },
    it: {
      title: 'Conferma di partecipazione',
      intro: 'Conferma la tua presenza per accedere al sito del matrimonio.',
      name: 'Nome',
      surname: 'Cognome',
      attendance: 'Parteciperai?',
      selectOption: "Seleziona un'opzione",
      yes: 'Sì, ci sarò',
      no: 'No, purtroppo non posso venire',
      continue: 'Continua',
      sorryTitle: 'Ci dispiace che tu non possa venire',
      sorryMsg: (n, s) =>
        `Grazie per avercelo fatto sapere, ${n} ${s}. Ci mancherai nel nostro giorno speciale, ma ti penseremo con affetto.`,
    },
  }[language];

  const styles = {
    fontFamily: '"Playfair Display", serif',
    blue80: 'rgba(0,110,255,0.8)',
    gold: '#e6cb6b',
    yellow: '#fff3b0',
  };

  function handleRSVPSubmit(e) {
    e.preventDefault();
    setStep(attending === 'yes' ? 'main' : 'sorry');
  }

  // BubbleBackground (floating circular photos/videos)
  // We'll render it behind content; it manages its own timing and pop behavior.

  // Elegant centered wrapper
  const Outer = ({ children }) => (
    <div
      className="min-h-screen w-full relative flex items-center justify-center site-gradient"
      style={{ fontFamily: styles.fontFamily, color: 'white' }}
    >
      <BubbleBackground
        media={media}
        maxDesktop={3}
        maxMobile={1}
        minSizeVw={8}
        maxSizeVw={28}
        imageLifespanMs={5000}
        opacity={0.28}
        avoidOverlap={true}
      />
      <div className="absolute inset-0 overlay-tint" />
      <div className="w-full max-w-3xl mx-auto px-6 sm:px-8 flex flex-col items-center text-center">
        {children}
      </div>
    </div>
  );

  if (step === 'iframe') {
    return (
      <Outer>
        <form
          onSubmit={handleRSVPSubmit}
          className="w-full mx-auto max-w-xl rounded-3xl p-8 sm:p-10 text-center shadow-2xl bg-white/3 backdrop-blur-sm border border-white/10 text-soft-white"
        >
          {/* Language toggle */}
          <div className="flex justify-center mb-6 gap-3">
            <button
              onClick={(e) => { e.preventDefault(); setLanguage('en'); }}
              className={`w-9 h-9 rounded-full border-2 ${language === 'en' ? 'border-white' : 'border-white/40'}`}
              title="English"
            >🇬🇧</button>
            <button
              onClick={(e) => { e.preventDefault(); setLanguage('it'); }}
              className={`w-9 h-9 rounded-full border-2 ${language === 'it' ? 'border-white' : 'border-white/40'}`}
              title="Italiano"
            >🇮🇹</button>
          </div>

          <h1 className="hero-text text-5xl sm:text-6xl md:text-7xl font-semibold tracking-wider mb-4 sm:mb-5">
            {t.title}
          </h1>
          <p className="hero-text opacity-95 mb-8 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            {t.intro}
          </p>

          <div className="grid gap-5 text-left w-full">
            <label className="text-base sm:text-lg">
              <span className="block mb-1">• {t.name}</span>
              <input
                required
                className="mt-0 w-full rounded-2xl bg-white/10 border border-white/50 px-4 py-3 placeholder-white/60 focus:outline-none focus:ring-2"
                style={{ color: 'white' }}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="text-base sm:text-lg">
              <span className="block mb-1">• {t.surname}</span>
              <input
                required
                className="mt-0 w-full rounded-2xl bg-white/10 border border-white/50 px-4 py-3 placeholder-white/60 focus:outline-none focus:ring-2"
                style={{ color: 'white' }}
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />
            </label>

            <label className="text-base sm:text-lg">
              <span className="block mb-1">• {t.attendance}</span>
              <select
                required
                className="mt-0 w-full rounded-2xl bg-white/10 border border-white/50 px-4 py-3 focus:outline-none focus:ring-2"
                style={{ color: 'white' }}
                value={attending || ''}
                onChange={(e) => setAttending(e.target.value)}
              >
                <option value="" disabled className="bg-[#1b1b1b]">
                  {t.selectOption}
                </option>
                <option value="yes" className="text-black">{t.yes}</option>
                <option value="no" className="text-black">{t.no}</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            className="mt-8 w-full sm:w-auto px-8 py-3.5 rounded-full font-medium btn-gold"
          >
            {t.continue}
          </button>
        </form>
      </Outer>
    );
  }

  if (step === 'sorry') {
    return (
      <Outer>
        <div className="w-full mx-auto max-w-2xl text-center text-soft-white">
          <h1 className="hero-text text-4xl sm:text-5xl md:text-6xl font-medium tracking-wide mb-4">
            {t.sorryTitle}
          </h1>
          <p className="hero-text opacity-95 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto">
            {t.sorryMsg(name, surname)}
          </p>
        </div>
      </Outer>
    );
  }

  // Main page (after "Yes") inside a framed area
  return (
    <div className="min-h-screen w-full relative site-gradient" style={{ fontFamily: styles.fontFamily }}>
      <BubbleBackground
        media={media}
        maxDesktop={3}
        maxMobile={1}
        minSizeVw={8}
        maxSizeVw={28}
        imageLifespanMs={5000}
        opacity={0.28}
        avoidOverlap={true}
      />
      <div className="absolute inset-0 overlay-tint" />
      <iframe
        src="/main-wedding-site.html"
        title="Giuseppe & Chloe Wedding Website"
        className="relative w-full h-screen border-0"
      />
    </div>
  );
}
