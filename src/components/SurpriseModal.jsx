import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { romanticAudio } from '../audio/romanticAudio';

export default function SurpriseModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      romanticAudio.playSurpriseReveal();

      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const colors = ['#f43f5e', '#ec4899', '#fda4af', '#fbcfe8', '#fff1f2'];

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: colors,
          shapes: ['circle'],
          scalar: 1.2
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: colors,
          shapes: ['circle'],
          scalar: 1.2
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="surprise-backdrop animate-fade-in">
      <div className="surprise-modal-card animate-scale-up">
        <div className="surprise-icon-badge">
          🌸
        </div>

        <h3 className="font-handwriting surprise-title">
          A Little Secret... 💌
        </h3>

        <p className="font-serif surprise-quote">
          "If I could choose one flower to give you every day, I'd choose a different one each time — but I'd always be giving them to you. Because no matter how many flowers exist in this world, you're still my favorite thing in it. ❤️"
        </p>

        <button
          onClick={onClose}
          id="btn-close-surprise"
        >
          Keep in My Heart 💖
        </button>
      </div>
    </div>
  );
}
