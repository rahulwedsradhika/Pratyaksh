import React from 'react';
import { useTheme } from '../../context/ThemeContext';

/**
 * CrumpledPaperBackground
 * 
 * Authentic Crumpled Paper White Background
 * Replaces dot grid with realistic procedural crumpled paper texture featuring:
 * - Natural tactile paper creases, folds, and ridges
 * - Directional ambient lighting & soft shading
 * - Pure white / natural warm paper base (#FAF9F6) in Light Mode
 * - Elegant tactile charcoal slate crumpled parchment in Dark Mode
 * - Zero dots or grid lines
 * - GPU hardware-accelerated for smooth 60fps scrolling
 */
export default function CrumpledPaperBackground() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div
      className="v3-crumpled-paper-root"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      {/* SVG Lighting & Noise Filters for Physical Paper Creases */}
      <svg width="0" height="0" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          {/* Light Mode: Crisp White Crumpled Paper Filter */}
          <filter id="v3-crumpled-paper-light" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.010 0.015"
              numOctaves="5"
              result="creases"
            />
            <feDiffuseLighting
              in="creases"
              lightingColor="#FFFFFF"
              surfaceScale="3.2"
              result="paperLight"
            >
              <feDistantLight azimuth="48" elevation="56" />
            </feDiffuseLighting>
            <feBlend mode="multiply" in="SourceGraphic" in2="paperLight" />
          </filter>

          {/* Dark Mode: Tactile Charcoal Slate Crumpled Parchment Filter */}
          <filter id="v3-crumpled-paper-dark" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.009 0.014"
              numOctaves="5"
              result="creasesDark"
            />
            <feDiffuseLighting
              in="creasesDark"
              lightingColor="#42454E"
              surfaceScale="2.8"
              result="paperLightDark"
            >
              <feDistantLight azimuth="52" elevation="54" />
            </feDiffuseLighting>
            <feBlend mode="screen" in="SourceGraphic" in2="paperLightDark" />
          </filter>
        </defs>
      </svg>

      {/* Fullscreen Crumpled Paper Canvas Surface */}
      <div
        className="v3-crumpled-paper-surface"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: isDark ? '#141517' : '#FAF9F6',
          filter: isDark ? 'url(#v3-crumpled-paper-dark)' : 'url(#v3-crumpled-paper-light)',
          transform: 'translateZ(0)',
          willChange: 'transform'
        }}
      />
    </div>
  );
}

