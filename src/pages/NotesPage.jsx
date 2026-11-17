import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ExternalLink, ChevronRight, BookOpen, Download } from 'lucide-react';
import StudentAppShell from '../components/StudentAppShell';
import PageContainer from '../components/shell/PageContainer';

export default function NotesPage() {
  const notesList = [
    {
      id: 'n1',
      title: 'Charaka Sutra Sthana 1 — Deerghanjiviteeya Adhyaya Notes',
      samhita: 'Charaka Samhita',
      description: 'Comprehensive verse-by-verse commentary analysis, Trisutra Ayurveda, and Padartha Vijnana roots.',
      pdfUrl: '/assets/sample-notes.pdf',
      pages: 14
    },
    {
      id: 'n2',
      title: 'Charaka Sutra Sthana 2 — Apamarga Tanduleeya Adhyaya Notes',
      samhita: 'Charaka Samhita',
      description: 'Pancha Karma dravyas, Shirovirechana drugs, and internal purification classifications.',
      pdfUrl: '/assets/sample-notes.pdf',
      pages: 18
    },
    {
      id: 'n3',
      title: 'Charaka Vimana Sthana 1 — Rasa Vimana Notes',
      samhita: 'Charaka Samhita',
      description: 'Ashta Ahara Vidhi Visheshayatana clinical rules, dietetics, and metabolic pharmacodynamics.',
      pdfUrl: '/assets/sample-notes.pdf',
      pages: 22
    }
  ];

  return (
    <StudentAppShell>
      <PageContainer>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
            <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Notes &amp; Handouts</span>
          </div>

          <div className="editorial-badge editorial-badge-terracotta mb-2">
            <FileText size={13} />
            <span>Academic Handouts</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Samhita Commentary Notes
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px' }}>
            High-yield classical commentaries, flowcharts, and comparative tables for AIAPGET and State PSC exams.
          </p>
        </div>

        {/* Notes Grid */}
        <div className="row g-3">
          {notesList.map((note) => (
            <div key={note.id} className="col-12 col-md-6 col-lg-4">
              <div className="editorial-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span className="editorial-badge" style={{ fontSize: '0.72rem' }}>
                      {note.samhita}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {note.pages} Pages
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 650, color: 'var(--text-primary)', marginBottom: '0.4rem', lineHeight: 1.35 }}>
                    {note.title}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.45 }}>
                    {note.description}
                  </p>
                </div>

                <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <a
                    href={note.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editorial-btn editorial-btn-secondary w-100"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <Download size={14} />
                    <span>Download Handout</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </StudentAppShell>
  );
}

