import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Play, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';

export default function PracticeDiscoveryPage() {
  const practiceModules = [
    {
      id: '6440dfbc632c6415afe69bc0',
      samhita: 'Charaka Samhita',
      sthana: 'Sutra Sthana',
      chapter: 'Chapter 1: Deerghanjiviteeya Adhyaya',
      level: 'AIAPGET / UG Basics',
      questionCount: 50,
      description: 'Bilingual questions covering Trisutra Ayurveda, Padartha Vijnana roots, Dravya-Guna-Karma, and verse commentaries.',
      verseRef: 'Cha. Su. 1/1 - 1/140'
    },
    {
      id: '6440dfbc632c6415afe69bc0', // Using verified practice set endpoint
      samhita: 'Charaka Samhita',
      sthana: 'Sutra Sthana',
      chapter: 'Chapter 1: Deep Commentary Analysis',
      level: 'Advanced / UPSC',
      questionCount: 20,
      description: 'Critical dissection of Chakrapani Datta commentary on Ayusho Veda and Hetu-Linga-Aushadha.',
      verseRef: 'Cha. Su. 1/24 - 1/67'
    },
    {
      id: '6440dfbc632c6415afe69bc0',
      samhita: 'Charaka Samhita',
      sthana: 'Vimana Sthana',
      chapter: 'Chapter 1 - 3: Rasa & Roganeeka Vimana',
      level: 'Samhita Intensive',
      questionCount: 40,
      description: 'Comprehensive evaluation of Ashta Ahara Vidhi Visheshayatana, Trividha Rogavishesha Vijnana, and Janapadodhwamsa.',
      verseRef: 'Cha. Vi. 1 - 3'
    }
  ];

  return (
    <StudentAppShell>
      <PageContainer>
        {/* Page Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div className="editorial-badge editorial-badge-terracotta mb-2">
            <Target size={13} />
            <span>Self-Paced Learning</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            Topic-wise Practice Hub
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
            Untimed, Samhita-referenced practice mode with immediate answer explanations and classical commentary citations.
          </p>
        </div>

        {/* Practice Modules Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {practiceModules.map((mod, idx) => (
            <div 
              key={`${mod.id}-${idx}`}
              className="editorial-card p-3 p-md-4"
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="editorial-badge" style={{ fontSize: '0.72rem' }}>
                      {mod.samhita} • {mod.sthana}
                    </span>
                    <span className="editorial-badge editorial-badge-success" style={{ fontSize: '0.72rem' }}>
                      {mod.level}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                    {mod.chapter}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '720px' }}>
                    {mod.description}
                  </p>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {mod.questionCount} Questions • {mod.verseRef}
                  </span>
                  <Link
                    to={`/practice/${mod.id}`}
                    className="editorial-btn editorial-btn-primary"
                    style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                  >
                    <Play size={14} fill="currentColor" />
                    <span>Start Practice</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </StudentAppShell>
  );
}

