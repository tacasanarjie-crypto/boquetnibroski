import React, { useState } from 'react';
import BouquetCanvas from './components/BouquetCanvas';
import IntroScreen from './components/IntroScreen';
import LoveLetter from './components/LoveLetter';
import SurpriseModal from './components/SurpriseModal';
import AudioToggle from './components/AudioToggle';
import './App.css';

export default function App() {
  const [hasReceivedFlowers, setHasReceivedFlowers] = useState(false);
  const [isIntroFading, setIsIntroFading] = useState(false);
  const [isSurpriseOpen, setIsSurpriseOpen] = useState(false);
  const [letterVisible, setLetterVisible] = useState(false);

  // Transition from opening screen to background bouquet & romantic messages
  const handleReceiveFlowers = () => {
    setIsIntroFading(true);
    setTimeout(() => {
      setHasReceivedFlowers(true);
    }, 800);

    // Reveal the romantic messages beside the bouquet
    setTimeout(() => {
      setLetterVisible(true);
    }, 1400);
  };

  return (
    <div className="app-container">
      {/* 3D Flower Bouquet as Full Background (crisp, unboxed, unobstructed) */}
      <div className="bouquet-background-layer fixed inset-0 z-0 pointer-events-auto">
        <BouquetCanvas
          isRevealed={hasReceivedFlowers}
          onBouquetClick={() => {}}
        />
      </div>

      {/* Unobtrusive Audio Toggle */}
      <AudioToggle isMusicActive={hasReceivedFlowers || isIntroFading} />

      {/* Opening Screen Overlay */}
      {!hasReceivedFlowers && (
        <IntroScreen
          onReceiveFlowers={handleReceiveFlowers}
          isFadingOut={isIntroFading}
        />
      )}

      {/* Main UI Overlay: Header & Messages Beside the Bouquet */}
      <main className="main-experience relative z-10 w-full min-h-screen pointer-events-none">
        {/* Subtle Romantic Title Banner */}
        <header className="experience-header text-center select-none pointer-events-auto">
          <div className="header-badge glass-pill">
            <span>💐 Handcrafted Wrapped Bouquet</span>
          </div>
          <h1 className="font-handwriting header-title romantic-header-glow">
            Forever in Bloom, For You
          </h1>
        </header>

        {/* Content Layout: Bouquet visible in open background on left; Messages placed beside it on right */}
        <div className="bouquet-messages-overlay">
          {/* Left area: Completely open & unboxed so the 3D flower bouquet background shines through */}
          <div className="bouquet-open-area pointer-events-none">
            {hasReceivedFlowers && (
              <div className="bouquet-floating-tag glass-pill animate-fade-in pointer-events-auto">
                <span className="tag-dot" />
                <span className="font-serif">To: My Favorite Person ❤️</span>
              </div>
            )}
          </div>

          {/* Right side: Romantic Messages Beside the Bouquet */}
          <div className={`messages-column pointer-events-auto love-letter-wrapper ${letterVisible ? 'revealed' : ''}`}>
            <LoveLetter onOpenSurprise={() => setIsSurpriseOpen(true)} />
          </div>
        </div>

        {/* Footer */}
        <footer className="experience-footer text-center font-serif pointer-events-auto">
          <p>Created with all my heart · Always and forever ❤️</p>
        </footer>
      </main>

      {/* Surprise Message Modal */}
      <SurpriseModal
        isOpen={isSurpriseOpen}
        onClose={() => setIsSurpriseOpen(false)}
      />
    </div>
  );
}
