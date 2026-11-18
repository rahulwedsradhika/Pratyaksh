import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { subjectImageSource } from '../services/subjectArtwork';

export default function SubjectArtwork({ subject }) {
  const source = subjectImageSource(subject.img);
  const [failedSource, setFailedSource] = useState(null);
  if (source && failedSource !== source) {
    return <img src={source} alt={subject.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setFailedSource(source)} />;
  }
  return (
    <div role="img" aria-label={`${subject.name}: artwork unavailable`} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.8rem', padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-subtle)' }}>
      <BookOpen size={38} aria-hidden="true" />
      <span style={{ fontSize: '1.1rem', fontWeight: 650, color: 'var(--text-primary)' }}>{subject.name}</span>
    </div>
  );
}
