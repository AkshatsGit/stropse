import { useEffect } from 'react';

const LINES = [
  { delay: 0,    duration: 4.2, left: '8%',  width: 1.5, opacity: 0.7 },
  { delay: 0.8,  duration: 5.8, left: '22%', width: 1,   opacity: 0.5 },
  { delay: 1.4,  duration: 3.9, left: '40%', width: 2,   opacity: 0.8 },
  { delay: 2.1,  duration: 6.2, left: '57%', width: 1,   opacity: 0.45 },
  { delay: 0.3,  duration: 4.7, left: '72%', width: 1.5, opacity: 0.65 },
  { delay: 1.9,  duration: 5.1, left: '88%', width: 1,   opacity: 0.5 },
];

export default function NeonLines() {
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'neon-laser-css';
    style.textContent = `
      .neon-line-container {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
      }

      .neon-laser {
        position: absolute;
        top: -5%;
        border-radius: 100px;
        background: linear-gradient(
          to bottom,
          transparent 0%,
          rgba(255, 230, 0, 0.03) 10%,
          rgba(255, 230, 0, 0.9) 48%,
          rgba(255, 255, 180, 1) 50%,
          rgba(255, 230, 0, 0.9) 52%,
          rgba(255, 230, 0, 0.03) 90%,
          transparent 100%
        );
        height: 220px;
        filter: blur(0.5px) drop-shadow(0 0 4px rgba(255, 230, 0, 0.9)) drop-shadow(0 0 12px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 30px rgba(255, 200, 0, 0.3));
        animation: neon-laser-fall linear infinite;
      }

      @keyframes neon-laser-fall {
        0%   { transform: translateY(-220px); opacity: 0; }
        5%   { opacity: 1; }
        95%  { opacity: 1; }
        100% { transform: translateY(105vh); opacity: 0; }
      }

      /* Glow pulse on cards/containers when laser passes */
      @keyframes container-laser-glow {
        0%   { box-shadow: none; }
        50%  { box-shadow: 0 0 0 1px rgba(255,230,0,0.35), 0 0 20px rgba(255,215,0,0.15), inset 0 0 15px rgba(255,215,0,0.04); }
        100% { box-shadow: none; }
      }

      .card, .t-card, .feature-card, .game-card, .gp-card-wrapper, .room-card, .cta-banner {
        animation: container-laser-glow 4s ease-in-out infinite;
        animation-delay: var(--laser-delay, 0s);
      }

      .t-card { --laser-delay: 0.5s; }
      .feature-card { --laser-delay: 1.2s; }
      .game-card { --laser-delay: 0.8s; }
      .gp-card-wrapper { --laser-delay: 2s; }
      .room-card { --laser-delay: 1.5s; }
      .cta-banner { --laser-delay: 2.5s; }
    `;
    if (!document.getElementById('neon-laser-css')) {
      document.head.appendChild(style);
    }
    return () => {
      document.getElementById('neon-laser-css')?.remove();
    };
  }, []);

  return (
    <div className="neon-line-container" aria-hidden="true">
      {LINES.map((line, i) => (
        <div
          key={i}
          className="neon-laser"
          style={{
            left: line.left,
            width: `${line.width}px`,
            opacity: line.opacity,
            animationDuration: `${line.duration}s`,
            animationDelay: `${line.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
