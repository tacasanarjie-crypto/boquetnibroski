import React from 'react';
import { romanticAudio } from '../audio/romanticAudio';

export default function IntroScreen({ onReceiveFlowers, isFadingOut }) {
  const handleClick = () => {
    romanticAudio.startMusic();
    romanticAudio.playSparkle();
    onReceiveFlowers();
  };

  return (
    <div className={`intro-overlay ${isFadingOut ? 'fading-out' : ''}`}>
      {/* Floating Sparkles & Hearts Atmosphere */}
      <div className="intro-particles">
        <div className="intro-particle animate-float-slow" style={{ top: '20%', left: '16%', fontSize: '1.6rem', opacity: 0.65 }}>🌸</div>
        <div className="intro-particle animate-float-mid" style={{ top: '30%', right: '18%', fontSize: '1.35rem', opacity: 0.55 }}>✨</div>
        <div className="intro-particle animate-float-fast" style={{ bottom: '24%', left: '22%', fontSize: '1.55rem', opacity: 0.65 }}>💖</div>
        <div className="intro-particle animate-float-slow" style={{ top: '18%', right: '32%', fontSize: '1.85rem', opacity: 0.45 }}>🌷</div>
        <div className="intro-particle animate-float-mid" style={{ bottom: '28%', right: '22%', fontSize: '1.35rem', opacity: 0.55 }}>✨</div>
      </div>

      {/* Main Content */}
      <div className="intro-content">
        <div className="intro-emblem animate-pulse-glow">
          💐
        </div>

        <div className="space-y-3">
          <h1 className="font-handwriting intro-title">
            Hey, my love. 💗
          </h1>
          <p className="font-serif intro-subtitle">
            I have something beautiful for you...
          </p>
        </div>

        <button
          id="btn-receive-flowers"
          onClick={handleClick}
          onMouseEnter={() => {
            romanticAudio.playFlowerChime(784);
          }}
        >
          <span>Receive Your Flowers 🌷</span>
        </button>

        <p className="font-sans intro-caption">
          A handcrafted digital gift
        </p>
      </div>
    </div>
  );
}
