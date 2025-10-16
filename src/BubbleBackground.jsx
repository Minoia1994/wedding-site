import React, { useEffect, useRef, useState } from 'react';

// BubbleBackground
// Props:
// - media: [{type: 'image'|'video', src}]
// - maxDesktop (default 3), maxMobile (default 1)
// - minSizeVw, maxSizeVw (percent of viewport width)
// - imageLifespanMs (default 5000)
// - opacity (0-1)
// - avoidOverlap: boolean

export default function BubbleBackground({
  media = [],
  maxDesktop = 3,
  maxMobile = 1,
  minSizeVw = 8,
  maxSizeVw = 28,
  imageLifespanMs = 5000,
  opacity = 0.28,
  avoidOverlap = true,
}) {
  const idRef = useRef(1);
  const [bubbles, setBubbles] = useState([]);
  const mediaRef = useRef(media);
  mediaRef.current = media;

  // determine max bubbles based on viewport
  const getMaxBubbles = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? maxMobile : maxDesktop);

  // simple helper to pick a random item from array
  const rand = (min, max) => Math.random() * (max - min) + min;

  // check overlap between a candidate and existing bubbles
  const isOverlapping = (candidate, others) => {
    for (const o of others) {
      const dx = (candidate.cx - o.cx);
      const dy = (candidate.cy - o.cy);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < candidate.r + o.r + 8) return true; // 8px padding
    }
    return false;
  };

  // create a bubble object with random position/size and content
  const createBubble = (content) => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

    const sizeVw = rand(minSizeVw, maxSizeVw);
    const sizePx = (sizeVw / 100) * vw;

    // candidate center position (in px) within viewport such that bubble fully visible
    const maxAttempts = 20;
    let attempt = 0;
    let leftPx, topPx;
    let cx, cy;

    const existing = bubbles.map((b) => ({ cx: b.cx, cy: b.cy, r: b.r }));

    do {
      leftPx = rand(0, vw - sizePx);
      topPx = rand(0, vh - sizePx - 80); // leave some top/bottom margin
      cx = leftPx + sizePx / 2;
      cy = topPx + sizePx / 2;
      attempt += 1;
      if (attempt > maxAttempts) break;
    } while (avoidOverlap && isOverlapping({ cx, cy, r: sizePx / 2 }, existing));

    const id = idRef.current++;

    return {
      id,
      src: content.src,
      type: content.type,
      sizeVw,
      sizePx,
      left: leftPx,
      top: topPx,
      cx,
      cy,
      r: sizePx / 2,
      opacity,
      createdAt: Date.now(),
      lifeMs: content.type === 'image' ? imageLifespanMs : null, // videos set later when metadata loads
      isPopping: false,
      z: 5 + Math.floor(Math.random() * 50),
      floatTarget: null,
    };
  };

  // spawn bubbles up to limit
  useEffect(() => {
    function spawnUntilLimit() {
      setBubbles((prev) => {
        const max = getMaxBubbles();
        if (prev.length >= max) return prev;
        const needed = max - prev.length;
        const newB = [];
        for (let i = 0; i < needed; i++) {
          const rawPool = mediaRef.current.length ? mediaRef.current : [];
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
          const pool = isMobile ? rawPool.filter((p) => p.type !== 'video') : rawPool;
          if (!pool.length) break;
          // pick next media in round-robin
          const content = pool[Math.floor(Math.random() * pool.length)];
          newB.push(createBubble(content));
        }
        return [...prev, ...newB];
      });
    }

    spawnUntilLimit();

    const onResize = () => {
      // reduce or increase bubble count on resize
      setBubbles((prev) => prev.slice(0, getMaxBubbles()));
      spawnUntilLimit();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaRef.current.length]);

  // lifecycle timers for each bubble (pop after lifeMs)
  useEffect(() => {
    const timers = [];

    bubbles.forEach((b) => {
      if (b.isPopping) return;

      if (b.type === 'image') {
        // schedule pop after lifeMs
        const remaining = b.lifeMs - (Date.now() - b.createdAt);
        const t = setTimeout(() => popBubble(b.id), Math.max(300, remaining));
        timers.push(t);
      }
      // video handled when metadata sets lifeMs
    });

    return () => timers.forEach((t) => clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubbles]);

  // pop animation and replacement
  const popBubble = (id) => {
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, isPopping: true } : b)));
    // remove after small pop animation
    setTimeout(() => {
      setBubbles((prev) => {
        const filtered = prev.filter((b) => b.id !== id);
        // spawn a replacement
        const pool = mediaRef.current.length ? mediaRef.current : [];
        if (pool.length && filtered.length < getMaxBubbles()) {
          const content = pool[Math.floor(Math.random() * pool.length)];
          return [...filtered, createBubble(content)];
        }
        return filtered;
      });
    }, 420); // pop duration
  };

  // gentle float: periodically pick a new float target for each bubble
  useEffect(() => {
    if (!bubbles.length) return;
    const interval = setInterval(() => {
      setBubbles((prev) =>
        prev.map((b) => {
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const maxX = Math.max(0, vw - (b.sizeVw / 100) * vw);
          const maxY = Math.max(0, vh - (b.sizeVw / 100) * vw - 80);
          const newLeft = rand(0, maxX);
          const newTop = rand(0, maxY);
          const cx = newLeft + ((b.sizeVw / 100) * vw) / 2;
          const cy = newTop + ((b.sizeVw / 100) * vw) / 2;
          return { ...b, left: newLeft, top: newTop, cx, cy };
        })
      );
    }, 4000 + Math.random() * 3500);

    return () => clearInterval(interval);
  }, [bubbles.length]);

  // render
  return (
    <div className="absolute inset-0 -z-20 pointer-events-none overflow-hidden">
      {bubbles.map((b) => (
        <div
          key={b.id}
          className={`absolute rounded-full overflow-hidden shadow-2xl transition-all duration-1000 ease-in-out`}
          style={{
            left: b.left,
            top: b.top,
            width: `${b.sizeVw}vw`,
            height: `${b.sizeVw}vw`,
            transform: b.isPopping ? 'scale(1.25)' : 'scale(1)',
            opacity: b.isPopping ? 0 : b.opacity,
            transitionProperty: 'transform, opacity, left, top',
            transitionDuration: b.isPopping ? '420ms' : '8000ms',
            border: '1px solid rgba(255,255,255,0.06)',
            zIndex: b.z,
            backdropFilter: 'blur(1px)',
          }}
        >
          {b.type === 'image' ? (
            <img
              src={b.src}
              alt=""
              className="w-full h-full object-cover bg-media"
              draggable={false}
              onLoad={() => { /* image loaded */ }}
            />
          ) : (
            <video
              src={b.src}
              className="w-full h-full object-cover bg-media"
              muted
              autoPlay
              playsInline
              controls={false}
              onLoadedMetadata={(ev) => {
                const duration = ev.currentTarget.duration * 1000;
                // set bubble life to video duration if not already set
                setBubbles((prev) =>
                  prev.map((x) => (x.id === b.id ? { ...x, lifeMs: duration } : x))
                );
                // schedule pop at duration
                setTimeout(() => popBubble(b.id), Math.max(300, duration));
              }}
            />
          )}

          {/* inner vignette to soften edges */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(0,0,0,0.18) 100%)',
              mixBlendMode: 'overlay',
            }}
          />
        </div>
      ))}
    </div>
  );
}
