import React, { useState } from 'react';
import { romanticAudio } from '../audio/romanticAudio';

export default function AudioToggle({ isMusicActive }) {
  const [isMuted, setIsMuted] = useState(false);

  const toggleSound = () => {
    if (!romanticAudio.isPlaying) {
      if (romanticAudio.isMuted) {
        romanticAudio.toggleMute();
      }
      romanticAudio.startMusic();
      setIsMuted(false);
      return;
    }
    const muted = romanticAudio.toggleMute();
    setIsMuted(muted);
  };

  if (!isMusicActive) return null;

  return (
    <button
      onClick={toggleSound}
      id="btn-music-toggle"
      aria-label={isMuted ? 'Unmute Sunflower Lo-Fi music' : 'Mute Sunflower Lo-Fi music'}
      className="audio-toggle-btn glass-card"
    >
      {!isMuted ? (
        <div className="music-bars">
          <span className="music-bar animate-music-bar-1" style={{ height: '8px' }} />
          <span className="music-bar animate-music-bar-2" style={{ height: '14px' }} />
          <span className="music-bar animate-music-bar-3" style={{ height: '6px' }} />
        </div>
      ) : (
        <span className="text-xs">🔇</span>
      )}
      <span className="audio-toggle-label font-sans">
        {isMuted ? 'Play Music' : 'Sunflower Lo-Fi'}
      </span>
    </button>
  );
}
