import { useEffect, useRef } from 'react';

const CONTROLLERS = [
  { delay: 0,    duration: 7,   left: '4%',  size: 18, opacity: 0.55, rotate: -15 },
  { delay: 1.2,  duration: 9,   left: '12%', size: 14, opacity: 0.4,  rotate: 10  },
  { delay: 0.5,  duration: 8,   left: '22%', size: 22, opacity: 0.6,  rotate: -8  },
  { delay: 2.4,  duration: 10,  left: '32%', size: 16, opacity: 0.35, rotate: 20  },
  { delay: 0.9,  duration: 7.5, left: '42%', size: 20, opacity: 0.5,  rotate: -20 },
  { delay: 3.1,  duration: 9.5, left: '52%', size: 14, opacity: 0.4,  rotate: 5   },
  { delay: 1.7,  duration: 8.5, left: '62%', size: 18, opacity: 0.55, rotate: -10 },
  { delay: 0.3,  duration: 11,  left: '70%', size: 12, opacity: 0.3,  rotate: 15  },
  { delay: 2.8,  duration: 8,   left: '78%', size: 20, opacity: 0.5,  rotate: -5  },
  { delay: 0.7,  duration: 9,   left: '86%', size: 15, opacity: 0.45, rotate: 12  },
  { delay: 1.5,  duration: 7,   left: '93%', size: 18, opacity: 0.5,  rotate: -18 },
  { delay: 3.8,  duration: 10,  left: '27%', size: 13, opacity: 0.35, rotate: 25  },
  { delay: 2.1,  duration: 8,   left: '57%', size: 17, opacity: 0.45, rotate: -12 },
];

function ControllerSVG({ size, rotate, opacity }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: `rotate(${rotate}deg)`,
        opacity,
        filter: 'drop-shadow(0 0 3px rgba(255,215,0,0.7))',
        display: 'block',
      }}
    >
      <path
        d="M4 13 C4 10 6 8 9 8 L23 8 C26 8 28 10 28 13 L28 17 C28 21 25 24 22 24 L21 24 C20 24 19 23 18 22 L14 22 C13 23 12 24 11 24 L10 24 C7 24 4 21 4 17 Z"
        fill="#FFD700" opacity="0.85"
      />
      <rect x="9" y="12" width="2.2" height="6" rx="0.6" fill="#1a1200"/>
      <rect x="7" y="14" width="6" height="2.2" rx="0.6" fill="#1a1200"/>
      <circle cx="22" cy="13" r="1.5" fill="#1a1200" opacity="0.7"/>
      <circle cx="25" cy="16" r="1.5" fill="#1a1200" opacity="0.7"/>
      <circle cx="22" cy="19" r="1.5" fill="#1a1200" opacity="0.7"/>
      <circle cx="19" cy="16" r="1.5" fill="#1a1200" opacity="0.7"/>
      <ellipse cx="9" cy="22" rx="4" ry="3" fill="#FFD700" opacity="0.7"/>
      <ellipse cx="23" cy="22" rx="4" ry="3" fill="#FFD700" opacity="0.7"/>
    </svg>
  );
}

export default function NeonLines() {
  const ctrlRefs = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    // Inject CSS
    const style = document.createElement('style');
    style.id = 'falling-ctrl-css';
    style.textContent = `
      .falling-ctrl-wrap {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
      }
      .falling-ctrl {
        position: absolute;
        top: -60px;
        animation: ctrlFall linear infinite;
      }
      @keyframes ctrlFall {
        0%   { transform: translateY(0); }
        100% { transform: translateY(calc(100vh + 100px)); }
      }

      /* ── Hero text glow when controller passes through ── */
      .hero-title-main.hero-lit .neon-letter {
        animation: none !important;
        color: #fffde0 !important;
        text-shadow:
          0 0 8px  rgba(255,245,80,1),
          0 0 24px rgba(255,215,0,0.85),
          0 0 60px rgba(255,200,0,0.4) !important;
        transition: color 0.12s ease, text-shadow 0.12s ease;
      }

      /* Container gentle glow */
      @keyframes containerCtrlGlow {
        0%, 80%   { box-shadow: none; }
        40%       { box-shadow: 0 0 0 1px rgba(255,215,0,0.2), 0 0 16px rgba(255,215,0,0.08); }
        100%      { box-shadow: none; }
      }
      .card, .t-card, .feature-card, .game-card, .gp-card-wrapper, .cta-banner {
        animation: containerCtrlGlow 8s ease-in-out infinite;
      }
      .t-card        { animation-delay: 1s; }
      .feature-card  { animation-delay: 2s; }
      .game-card     { animation-delay: 0.5s; }
    `;
    if (!document.getElementById('falling-ctrl-css')) {
      document.head.appendChild(style);
    }

    // rAF loop — check if any controller overlaps the hero text
    let lastLit = false;
    function tick() {
      const textEl = document.querySelector('.hero-title-main');
      if (textEl) {
        const textRect = textEl.getBoundingClientRect();
        // Expand by 20px padding so glow starts slightly before contact
        const pad = 20;
        let anyOverlap = false;

        ctrlRefs.current.forEach((el) => {
          if (!el) return;
          const cr = el.getBoundingClientRect();
          // Check vertical overlap
          if (cr.bottom + pad > textRect.top && cr.top - pad < textRect.bottom) {
            anyOverlap = true;
          }
        });

        if (anyOverlap !== lastLit) {
          lastLit = anyOverlap;
          textEl.classList.toggle('hero-lit', anyOverlap);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.getElementById('falling-ctrl-css')?.remove();
    };
  }, []);

  return (
    <div className="falling-ctrl-wrap" aria-hidden="true">
      {CONTROLLERS.map((c, i) => (
        <div
          key={i}
          className="falling-ctrl"
          ref={(el) => { ctrlRefs.current[i] = el; }}
          style={{
            left: c.left,
            animationDuration: `${c.duration}s`,
            animationDelay: `-${c.delay}s`, // negative delay = start mid-cycle so screen isn't empty on load
          }}
        >
          <ControllerSVG size={c.size} rotate={c.rotate} opacity={c.opacity} />
        </div>
      ))}
    </div>
  );
}
