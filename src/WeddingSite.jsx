import React, { useMemo, useState, useEffect } from 'react';
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
  const [_attending, setAttending] = useState(null);
  const [language, setLanguage] = useState('en');
  // idx state and crossfade handled by BubbleBackground; remove unused state

  // listen for RSVP messages from the iframe
  useEffect(() => {
    function onMessage(e) {
      if (!e?.data) return;
      try {
        const payload = e.data;
        if (payload.action === 'rsvp') {
          setName(payload.name || '');
          setSurname(payload.surname || '');
          setAttending(payload.attending || null);
          setStep(payload.attending === 'yes' ? 'main' : 'sorry');
        } else if (payload.action === 'setLanguage') {
          if (payload.language === 'en' || payload.language === 'it') setLanguage(payload.language);
        }
      } catch {
        // ignore
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

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
        <div className="w-full flex items-center justify-center">
          {/* responsive square wrapper — keeps iframe a centered square */}
          <div className="px-4" style={{ width: 'min(92vw, 720px)', height: 'min(92vw, 720px)', maxWidth: 920 }}>
            <iframe
              src="/rsvp.html"
              title="RSVP"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 22,
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 20px 60px rgba(2,6,23,0.6)',
                background: 'transparent',
                overflow: 'hidden',
              }}
              className="mx-auto block"
            />
          </div>
        </div>
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
