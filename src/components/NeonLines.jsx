import { useEffect } from 'react';

// 8 controllers at varied horizontal positions & speeds
const CONTROLLERS = [
  { delay: 0,    duration: 7,   left: '6%',  size: 18, opacity: 0.55, rotate: -15 },
  { delay: 1.2,  duration: 9,   left: '18%', size: 14, opacity: 0.4,  rotate: 10  },
  { delay: 0.5,  duration: 8,   left: '32%', size: 22, opacity: 0.6,  rotate: -8  },
  { delay: 2.4,  duration: 10,  left: '48%', size: 16, opacity: 0.35, rotate: 20  },
  { delay: 0.9,  duration: 7.5, left: '62%', size: 20, opacity: 0.5,  rotate: -20 },
  { delay: 3.1,  duration: 9.5, left: '74%', size: 14, opacity: 0.4,  rotate: 5   },
  { delay: 1.7,  duration: 8.5, left: '84%', size: 18, opacity: 0.55, rotate: -10 },
  { delay: 0.3,  duration: 11,  left: '93%', size: 12, opacity: 0.3,  rotate: 15  },
];

// A clean gold gamepad SVG path
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
      {/* Body */}
      <path
        d="M4 13 C4 10 6 8 9 8 L23 8 C26 8 28 10 28 13 L28 17 C28 21 25 24 22 24 L21 24 C20 24 19 23 18 22 L14 22 C13 23 12 24 11 24 L10 24 C7 24 4 21 4 17 Z"
        fill="#FFD700"
        opacity="0.85"
      />
      {/* D-pad vertical */}
      <rect x="9" y="12" width="2.2" height="6" rx="0.6" fill="#1a1200"/>
      {/* D-pad horizontal */}
      <rect x="7" y="14" width="6" height="2.2" rx="0.6" fill="#1a1200"/>
      {/* Buttons */}
      <circle cx="22" cy="13" r="1.5" fill="#1a1200" opacity="0.7"/>
      <circle cx="25" cy="16" r="1.5" fill="#1a1200" opacity="0.7"/>
      <circle cx="22" cy="19" r="1.5" fill="#1a1200" opacity="0.7"/>
      <circle cx="19" cy="16" r="1.5" fill="#1a1200" opacity="0.7"/>
      {/* Grips */}
      <ellipse cx="9" cy="22" rx="4" ry="3" fill="#FFD700" opacity="0.7"/>
      <ellipse cx="23" cy="22" rx="4" ry="3" fill="#FFD700" opacity="0.7"/>
    </svg>
  );
}

export default function NeonLines() {
  useEffect(() => {
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
        0%   { transform: translateY(-60px); }
        100% { transform: translateY(110vh); }
      }
      /* Container glow when controllers pass through */
      @keyframes containerCtrlGlow {
        0%, 80%   { box-shadow: none; }
        40%       { box-shadow: 0 0 0 1px rgba(255,215,0,0.2), 0 0 16px rgba(255,215,0,0.08); }
        100%      { box-shadow: none; }
      }
      .card, .t-card, .feature-card, .game-card, .gp-card-wrapper, .cta-banner {
        animation: containerCtrlGlow 8s ease-in-out infinite;
      }
      .t-card { animation-delay: 1s; }
      .feature-card { animation-delay: 2s; }
      .game-card { animation-delay: 0.5s; }
    `;
    if (!document.getElementById('falling-ctrl-css')) {
      document.head.appendChild(style);
    }
    return () => document.getElementById('falling-ctrl-css')?.remove();
  }, []);

  return (
    <div className="falling-ctrl-wrap" aria-hidden="true">
      {CONTROLLERS.map((c, i) => (
        <div
          key={i}
          className="falling-ctrl"
          style={{
            left: c.left,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        >
          <ControllerSVG size={c.size} rotate={c.rotate} opacity={c.opacity} />
        </div>
      ))}
    </div>
  );
}
