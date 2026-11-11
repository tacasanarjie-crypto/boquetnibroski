import React, { useState } from 'react';
import { romanticAudio } from '../audio/romanticAudio';

const SIDE_MESSAGES = [
  {
    id: 'note-1',
    icon: '🌹',
    tag: 'Note #1 · Every Petal',
    title: 'For the girl who makes my world bloom',
    preview: 'If I could give you every flower in the world, I would...',
    body: [
      "If I could give you every flower in the world, I would. But even a thousand flowers wouldn't be enough to show you how special you are to me.",
      "So here's a wrapped bouquet made just for you — a reminder that somewhere in this big world, there's someone who thinks of you, smiles because of you, and feels so lucky to have you in his life.",
      "You deserve all the beautiful things this world has to offer, my love. Always."
    ],
    signoff: 'These are for you, beautiful. Always. ❤️'
  },
  {
    id: 'note-2',
    icon: '🌷',
    tag: 'Note #2 · Why You',
    title: 'Why you mean everything to me',
    preview: 'Your laugh, your kindness, and the way you light up every room...',
    body: [
      "Every single flower in this bouquet represents a reason why I adore you — your gentle heart, your warm smile, and the way just talking to you makes my whole day better.",
      "Even on the busiest days, you are my favorite thought and my sweetest peace.",
      "Thank you for being effortlessly wonderful, just by being you."
    ],
    signoff: 'Forever grateful for you, my love. 💖'
  },
  {
    id: 'note-3',
    icon: '✨',
    tag: 'Note #3 · My Promise',
    title: 'A bouquet that never wilts',
    preview: 'Real flowers fade after a few days, so I wanted to give you...',
    body: [
      "Real flowers eventually fade, so I wanted to give you a bouquet that stays in bloom forever — just like the way I care about you.",
      "Whenever you're having a long day or just need a little reminder of how loved you are, come back here and know my heart is always right beside you.",
      "No matter the distance or the time, I'm always cheering for you and holding you close."
    ],
    signoff: 'Yours today, tomorrow, and always. 🌸'
  }
];

const MINI_NOTES = [
  { emoji: '💌', text: '"You are the prettiest part of my every day."' },
  { emoji: '🌷', text: '"Every flower here whispers how much I adore you."' },
  { emoji: '💖', text: '"My favorite place will always be right beside you."' }
];

export default function LoveLetter({ onOpenSurprise }) {
  const [activeNoteIdx, setActiveNoteIdx] = useState(0);
  const activeNote = SIDE_MESSAGES[activeNoteIdx];

  const handleSelectNote = (idx) => {
    setActiveNoteIdx(idx);
    romanticAudio.playFlowerChime(640 + idx * 80);
  };

  return (
    <section className="messages-beside-section">
      {/* Message Selector Pills */}
      <div className="message-tabs" role="tablist" aria-label="Romantic messages">
        {SIDE_MESSAGES.map((note, idx) => {
          const isActive = idx === activeNoteIdx;
          return (
            <button
              key={note.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectNote(idx)}
              className={`message-tab-pill ${isActive ? 'active' : ''}`}
            >
              <span>{note.icon}</span>
              <span>{note.tag}</span>
            </button>
          );
        })}
      </div>

      {/* Main Parchment / Love Letter Card */}
      <div className="love-letter-card glass-card">
        {/* Subtle decorative corners */}
        <div className="corner-star top-left">✦</div>
        <div className="corner-star top-right">✦</div>
        <div className="corner-star bottom-left">✦</div>
        <div className="corner-star bottom-right">✦</div>

        {/* Wax Seal / Flower Badge */}
        <div className="letter-seal-row">
          <div className="letter-wax-seal" title="Sealed with love">
            {activeNote.icon}
          </div>
          <span className="letter-badge-tag">{activeNote.tag}</span>
        </div>

        {/* Letter Heading */}
        <h2 className="font-handwriting letter-title">
          {activeNote.title}
        </h2>

        {/* Letter Body */}
        <div className="font-serif letter-body">
          {activeNote.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}

          <div className="letter-divider" />

          <p className="font-handwriting letter-signoff">
            {activeNote.signoff}
          </p>
        </div>

        {/* Next Note & Surprise Actions */}
        <div className="letter-actions">
          <button
            type="button"
            onClick={() => handleSelectNote((activeNoteIdx + 1) % SIDE_MESSAGES.length)}
            className="btn-next-note"
          >
            <span>Read Next Note ({activeNoteIdx + 1}/{SIDE_MESSAGES.length})</span>
            <span>→</span>
          </button>

          <button
            id="btn-open-surprise"
            type="button"
            onClick={onOpenSurprise}
            className="btn-surprise-trigger"
          >
            <span>One More Thing, My Love</span>
            <span className="surprise-icon">💌</span>
          </button>
        </div>
      </div>

      {/* Sweet Mini Notes Row Beneath the Main Letter */}
      <div className="mini-notes-grid">
        {MINI_NOTES.map((item, i) => (
          <div
            key={i}
            className="mini-note-card glass-pill"
            onClick={() => romanticAudio.playFlowerChime(700 + i * 70)}
          >
            <span className="mini-note-emoji">{item.emoji}</span>
            <p className="font-serif mini-note-text">{item.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
