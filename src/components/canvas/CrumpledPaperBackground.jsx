import React from 'react';

// Static gradients preserve the warm canvas without full-screen SVG lighting work.
export default function CrumpledPaperBackground() {
  return <div className="v3-crumpled-paper-root" aria-hidden="true" style={{
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    backgroundColor: 'var(--bg-canvas)',
    backgroundImage: 'linear-gradient(135deg, transparent 35%, #80808006 50%, transparent 65%), radial-gradient(ellipse at top right, var(--bg-accent-tint), transparent 65%)'
  }} />;
}
