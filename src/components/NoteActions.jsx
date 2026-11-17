import React, { useState } from 'react';
import { Eye, Download } from 'lucide-react';
import { studentFetch } from '../services/studentFetch';

export default function NoteActions({ noteId, title = 'Lecture notes' }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function open(mode) {
    if (busy) return;
    let tab;
    if (mode === 'view') {
      tab = window.open('about:blank', '_blank');
      if (!tab) { setError('Allow a new tab to view the PDF, or use Download.'); return; }
      tab.opener = null;
      tab.document.title = 'Loading notes…';
    }
    setBusy(mode); setError('');
    try {
      const response = await studentFetch(`/api/student/notes/${encodeURIComponent(noteId)}/file${mode === 'download' ? '?download=1' : ''}`);
      if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.message || 'Notes could not be opened.'); }
      const blob = await response.blob();
      if (!blob.type.includes('application/pdf')) throw new Error('This document is not a PDF.');
      const url = URL.createObjectURL(blob);
      if (tab) tab.location.replace(url);
      else {
        const link = document.createElement('a'); link.href = url; link.download = `${title.replace(/[\\/]/g, '-')}.pdf`;
        document.body.appendChild(link); link.click(); link.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) { tab?.close(); setError(error.message); }
    finally { setBusy(''); }
  }
  if (!noteId) return null;
  return <div className="classroom-note-actions"><div><button type="button" className="editorial-btn editorial-btn-secondary" disabled={Boolean(busy)} onClick={() => open('view')}><Eye size={15}/>{busy === 'view' ? 'Opening…' : 'View notes'}</button><button type="button" className="editorial-btn editorial-btn-primary" disabled={Boolean(busy)} onClick={() => open('download')}><Download size={15}/>{busy === 'download' ? 'Downloading…' : 'Download'}</button></div>{error && <p role="alert">{error}</p>}</div>;
}
