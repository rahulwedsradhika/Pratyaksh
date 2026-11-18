import {isAppleTouchDevice} from '../../utils/appleVideoCompatibility';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import InstallAppButton from '../InstallAppButton';
import { 
  Play, 
  ExternalLink,
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  HelpCircle,
  FileText,
  Volume2,
  Award,
  Video,
  Activity,
  Check,
  X,
  Download,
  RotateCcw
} from 'lucide-react';

const FEATURED_LECTURES = [
  {
    id: 'a332cfc3-37f5-4e1b-a558-5d7c14ad167f',
    title: 'Charaka Sutra 17: कियन्तः शिरसीय अध्याय',
    samhita: 'Charaka Samhita',
    faculty: 'Dr. Rahul Parihar',
    duration: '59 Min',
    badge: 'Core Brihattrayi',
    notes: 'In-depth analysis of 5 varieties of Shiroroga and Hridroga, Tridosha-Gati, and clinical differential diagnosis.',
    tags: ['Shiroroga', 'Tridosha', 'Kiyantah Shirasiya'],
    pdfUrl: '/assets/upload/1778775192256_Cha Su 1.pdf',
    pdfSize: '2.1 MB PDF',
    chapterRef: 'Charaka Sutra 17.6',
    shlokaTopic: 'शिरोरोगाणां पञ्चत्वम् एवं साध्यासाध्यता',
    sanskritShloka: 'वातात् पित्तात् कफाच्चैव संनिपातात्तथाऽपराः ।\nकृमिजाश्च तथा ज्ञेयाः शिरोरोगाः सुदारुणाः ॥',
    clinicalBreakdown: 'Charaka classifies Shiroroga into five categories: Vataja, Pittaja, Kaphaja, Sannipataja, and Krimija. This lecture demonstrates differential pulse diagnostics and immediate Dravya formulation protocols for hospital outpatient care.',
    highYieldPoints: [
      'Tridoshic pathology differentiation mnemonics for AIAPGET',
      'Hridroga 5-fold classification comparative synoptic matrix',
      'Shloka recitation audio pronunciation verified with meter'
    ],
    quiz: {
      id: 'CS17',
      code: 'AIAPGET MOCK QUESTION #412',
      prompt: "According to Acharya Charaka (Sutrasthana 2.16), the superiority of a physician possessing 'Yukti' over one with mere drug knowledge is established because:",
      options: [
        { id: 'A', text: 'Dravya is static, while Yukti encompasses Desha, Kala, Matra, and Bala of the patient.', correct: true },
        { id: 'B', text: 'Yukti eliminates the requirement of learning Dravya Guna.', correct: false },
        { id: 'C', text: 'Only theoretical Shastra learning is sufficient without practical application.', correct: false },
        { id: 'D', text: 'Yukti was an ancient methodology restricted only to surgeons.', correct: false }
      ],
      referenceText: 'Charaka Sutrasthana 2.16: "मात्राकालाश्रया युक्तिः सिद्धियुक्तौ प्रतिष्ठिता । तिष्ठत्युपरि युक्तिज्ञो द्रव्यज्ञानवतां सदा ॥"',
      rationale: 'Successful therapeutics depends on Yukti taking into account patient constitution, timing, and exact dosage rather than raw drug memory.'
    }
  },
  {
    id: 'a67d62aa-fc39-473f-b3a7-a82d240aa892',
    title: 'Rasashastra: Clinical Formulations & Shodhana',
    samhita: 'Rasashastra & Bhaishajya Kalpana',
    faculty: 'Pratyaksh Faculty Panel',
    duration: '66 Min',
    badge: 'Pharmaceutical High-Yield',
    notes: 'Parada Samskaras, Maharasa, Uparasa processing algorithms and AIAPGET frequently repeated MCQ concepts.',
    tags: ['Parada', 'Maharasa', 'Bhasma Pariksha'],
    pdfUrl: '/assets/upload/1786615240399_Anukta roga.pdf',
    pdfSize: '1.3 MB PDF',
    chapterRef: 'Rasaratna Samucchaya 1.42',
    shlokaTopic: 'पारद अष्टसंस्कार एवं भस्म परीक्षा विधान',
    sanskritShloka: 'यथा हि कुरुते कर्म रसराट् शोधितस्तथा ।\nअशुद्धस्तु तथा नाशं कुरुते च कलेवरे ॥',
    clinicalBreakdown: 'Systematic protocol of Parada Samskaras (Svedana to Dipana), distinction between Hingulottha Parada and Shodhita Parada, and critical quality benchmarks (Rekhapurnatva, Varitara, Apunarbhava) essential for modern AYUSH manufacturing.',
    highYieldPoints: [
      '8 Parada Samskara sequence mnemonics & herbal drug matrices',
      'Bhasma Pariksha standard test parameters verified against NABL',
      'Frequently repeated AIAPGET pharmaceutical formulation keys'
    ],
    quiz: {
      id: 'RS01',
      code: 'AIAPGET MOCK QUESTION #528',
      prompt: 'Which classical test for Bhasma Pariksha confirms that the mineral or metal has been completely incinerated into an ultra-fine micro-particulate state that defies surface tension?',
      options: [
        { id: 'A', text: 'Varitara Pariksha (floating effortlessly on the surface of calm water)', correct: true },
        { id: 'B', text: 'Gata-Rasatva (complete loss of metallic taste)', correct: false },
        { id: 'C', text: 'Subhaga Guna (smoothness on palm friction)', correct: false },
        { id: 'D', text: 'Agni-Pravritti Pariksha (glow test under intense furnace heat)', correct: false }
      ],
      referenceText: 'Rasaratna Samucchaya 8.28: "अङ्गुष्ठतर्जनीघृष्टं यत्सूक्ष्मं प्रविशेत्करात् । तोयोपरि प्लवेत् यत्तु वारितरं तदुच्यते ॥"',
      rationale: 'Varitara proves micro-particulate lightness when a pinch of properly incinerated Bhasma floats without sinking on still water.'
    }
  },
  {
    id: 'b9a8f623-8205-4d85-8950-7943f48bc72a',
    title: 'Trividha Karma: Purva, Pradhana & Pashchat Karma',
    samhita: 'Sushruta & Vagbhata Synthesis',
    faculty: 'Pratyaksh Surgical Faculty',
    duration: '48 Min',
    badge: 'Surgical & Panchakarma',
    notes: 'Clinical operative protocols, classical Shastra vidhi, and modern clinical correlation for hospital rounds.',
    tags: ['Shalya', 'Panchakarma', 'Sutra Sthana'],
    pdfUrl: '/assets/upload/1784967602023_FINAL Trividha Karma.pdf',
    pdfSize: '1.3 MB PDF',
    chapterRef: 'Sushruta Sutra 5.3',
    shlokaTopic: 'सुश्रुतोक्त त्रिविध कर्म विधि एवं संसर्जन क्रम',
    sanskritShloka: 'पूर्वकर्माणि कुर्वीत यथोक्तानि विशेषतः ।\nप्रधानकर्म तत्पश्चात् पश्चात्कर्म च युक्तितः ॥',
    clinicalBreakdown: 'Complete tri-stage operative methodology: Purva Karma (Deepana-Pachana, Snehana-Svedana, Sambhara-Sangraha), Pradhana Karma (precise surgical execution & Vega observation), and Pashchat Karma (Samsarjana Krama, Dhumapana, Pariharya adherence).',
    highYieldPoints: [
      'Purva Karma contraindications & patient clinical fitness criteria',
      'Samsarjana Krama Peyadi dietary schedule calculation matrix',
      'Sushruta vs Charaka Panchakarma procedural commentary comparison'
    ],
    quiz: {
      id: 'TK03',
      code: 'AIAPGET MOCK QUESTION #619',
      prompt: 'In the classical Samsarjana Krama following Vamana or Virechana, what is the exact prescribed dietary transition to rekindle Mandagni without provoking Ama?',
      options: [
        { id: 'A', text: 'Peya → Vilepi → Akrita Yusha → Krita Yusha → Mamsa / Laghu Anna', correct: true },
        { id: 'B', text: 'Mamsa Rasa → Peya → Vilepi → Krita Yusha', correct: false },
        { id: 'C', text: 'Vilepi → Peya → Krita Yusha → Akrita Yusha', correct: false },
        { id: 'D', text: 'Krita Yusha → Akrita Yusha → Peya → Vilepi', correct: false }
      ],
      referenceText: 'Charaka Siddhisthana 1.22: "पेयां विलेपीमकृतं कृतं च यूषं रसं त्रिर्द्विरथैकशश्च । क्रमेण सेवेत नरोऽन्नकाले प्रधानमध्यावरशुद्धिशुद्धः ॥"',
      rationale: 'Samsarjana Krama starts with ultra-light Peya (clear liquid gruel) and progressively moves to Vilepi, Akrita Yusha, Krita Yusha, and light solid food.'
    }
  }
];

export default function WarmHeroSection() {
  const [activeLecture, setActiveLecture] = useState(FEATURED_LECTURES[0]);
  const [showInteractivePlayer, setShowInteractivePlayer] = useState(false);
  const [activeTab, setActiveTab] = useState('lecture'); // 'lecture' | 'samhita' | 'quiz'
  const [quizAnswer, setQuizAnswer] = useState(null);

  const scrollToPricing = () => {
    const el = document.getElementById('pricing');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const bunnyEmbedUrl = `https://iframe.mediadelivery.net/embed/330113/${activeLecture.id}?autoplay=false&playsinline=true`;
  const bunnyDirectUrl = bunnyEmbedUrl;
  const appleTouch = typeof navigator !== 'undefined' && isAppleTouchDevice(navigator);

  return (
    <section id="hero" className="v3-hero-section" aria-label="Hero Section">
      <div className="v3-container">

        {/* Hero Sanskrit Calligraphy & Title in BIG Text with Crazy Shimmer Animations */}
        <div className="v3-hero-shloka-container">
          <p className="v3-hero-pretitle">The Future of Ayurveda is</p>
          <h1 className="v3-hero-shloka-text">
            <span className="v3-shloka-line">तिष्ठत्युपरि युक्तिज्ञो</span>{' '}
            <span className="v3-shloka-line">द्रव्यज्ञानवतां सदा ॥</span>
          </h1>
        </div>

        {/* Hero Action CTAs */}
        <div className="v3-hero-actions">
          <button
            type="button"
            onClick={scrollToPricing}
            className="v3-btn-primary v3-hero-cta-glow"
          >
            <span>Explore Memberships</span>
            <ArrowRight size={18} />
          </button>

          <Link
            to="/login"
            className="v3-btn-secondary"
          >
            <span>Classroom Sign In</span>
          </Link>
          <InstallAppButton compact />
        </div>

        {/* 2-Column Hero Interactive Showcase (Student Scholar + Real Bunny Video Player) */}
        <div className="v3-hero-showcase-grid">
          
          {/* Left Column: Student Scholar Character with Orbiting Animated Floating Badges */}
          <div className="v3-scholar-card">
            <div className="v3-scholar-image-wrapper">
              <img
                src="/assets/home/scholar-student.webp"
                srcSet="/assets/home/scholar-student-320.webp 320w, /assets/home/scholar-student.webp 640w"
                sizes="(max-width: 767px) calc(100vw - 64px), 380px"
                width="872" height="842" fetchPriority="high" decoding="async"
                alt="Ayurveda Scholar Student Thinking"
                className="v3-scholar-image v3-floating-gentle"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/assets/website-assets/img/object.png';
                }}
              />

              {/* Floating Badge 1: NCISM Competency */}
              <div className="v3-floating-pill v3-pill-top-left">
                <div className="v3-pill-icon-circle" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                  <BookOpen size={16} />
                </div>
                <div className="v3-pill-content">
                  <span className="v3-pill-label">NCISM Competency</span>
                  <span className="v3-pill-val">Complete Curriculum</span>
                </div>
              </div>

              {/* Floating Badge 2: AIAPGET Rank 1 Focus */}
              <div className="v3-floating-pill v3-pill-top-right">
                <div className="v3-pill-icon-circle" style={{ background: '#FEF3C7', color: '#B45309' }}>
                  <Award size={16} />
                </div>
                <div className="v3-pill-content">
                  <span className="v3-pill-label">AIAPGET Target</span>
                  <span className="v3-pill-val">Top 1% Percentile</span>
                </div>
              </div>

              {/* Floating Badge 3: 500+ Hours HD Video */}
              <div className="v3-floating-pill v3-pill-bottom-left">
                <div className="v3-pill-icon-circle" style={{ background: '#DCFCE7', color: '#15803D' }}>
                  <Video size={16} />
                </div>
                <div className="v3-pill-content">
                  <span className="v3-pill-label">Encrypted Stream</span>
                  <span className="v3-pill-val">500+ HD Lectures</span>
                </div>
              </div>

              {/* Floating Badge 4: Yukti Clinical Logic */}
              <div className="v3-floating-pill v3-pill-bottom-right">
                <div className="v3-pill-icon-circle" style={{ background: '#F3E8FF', color: '#7E22CE' }}>
                  <Sparkles size={16} />
                </div>
                <div className="v3-pill-content">
                  <span className="v3-pill-label">Yukti Method</span>
                  <span className="v3-pill-val">Concept Retention</span>
                </div>
              </div>
            </div>

            <div className="v3-scholar-footer">
              <div className="v3-scholar-quote">
                “Pratyaksh completely transformed how I read Charaka. I finally understand the *why* behind every shloka.”
              </div>
              <div className="v3-scholar-author">
                — Dr. Ananya Sharma, AIAPGET AIR 14 Aspirant
              </div>
            </div>
          </div>

          {/* Right Column: Genuine Bunny Stream Video Player Stage */}
          <div className="v3-player-stage-card">
            
            {/* Top Stage Header with Tabs & Authentic Live Signal */}
            <div className="v3-stage-header">
              <div className="v3-stage-dots">
                <div className="v3-stage-dot" />
                <div className="v3-stage-dot" />
                <div className="v3-stage-dot" />
              </div>

              {/* Lecture Switcher Tabs */}
              <div className="v3-stage-tabs" role="tablist">
                <button
                  type="button"
                  className={`v3-stage-tab-btn ${activeTab === 'lecture' ? 'active' : ''}`}
                  onClick={() => setActiveTab('lecture')}
                >
                  <Play size={13} />
                  <span>Real Video Lecture</span>
                </button>
                <button
                  type="button"
                  className={`v3-stage-tab-btn ${activeTab === 'samhita' ? 'active' : ''}`}
                  onClick={() => setActiveTab('samhita')}
                >
                  <BookOpen size={13} />
                  <span>Samhita Notes</span>
                </button>
                <button
                  type="button"
                  className={`v3-stage-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
                  onClick={() => setActiveTab('quiz')}
                >
                  <HelpCircle size={13} />
                  <span>AIAPGET MCQ Drill</span>
                </button>
              </div>

              <div className="v3-live-indicator-pill d-none d-md-flex">
                <span className="v3-live-pulse-dot" />
                <span>Live HD 1080p</span>
              </div>
            </div>

            {/* Stage Body */}
            <div className="v3-stage-body">
              
              {/* TAB 1: Real Bunny Video Stream */}
              {activeTab === 'lecture' && (
                <div className="v3-bunny-player-container">
                  
                  {/* Playlist Selector Dropdown / Pills */}
                  <div className="v3-lecture-playlist-row">
                    <span className="v3-playlist-label">Select Demo Lecture:</span>
                    <div className="v3-playlist-buttons">
                      {FEATURED_LECTURES.map((lec) => (
                        <button
                          key={lec.id}
                          type="button"
                          className={`v3-playlist-btn ${activeLecture.id === lec.id ? 'active' : ''}`}
                          onClick={() => {
                            setActiveLecture(lec);
                            setShowInteractivePlayer(false);
                            setQuizAnswer(null);
                          }}
                        >
                          <Video size={13} />
                          <span>{lec.samhita.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Responsive Iframe Container for Genuine Bunny Stream with no-referrer */}
                  <div className="v3-bunny-iframe-wrapper">
                    {appleTouch ? <a href={bunnyDirectUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="v3-video-load-button" aria-label={`Watch demo lecture in browser: ${activeLecture.title}`}><Play size={36} aria-hidden="true" /><strong>Watch a free lecture</strong><span>Opens the video player in your browser</span></a> : showInteractivePlayer ? <iframe
                      src={bunnyEmbedUrl}
                      title={activeLecture.title}
                      loading="lazy"
                      className="v3-bunny-iframe"
                      allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
                      allowFullScreen={true}
                      referrerPolicy="no-referrer"
                    /> : <button type="button" className="v3-video-load-button" onClick={() => setShowInteractivePlayer(true)} aria-label={`Load demo lecture: ${activeLecture.title}`}><Play size={36} aria-hidden="true" /><strong>Watch a free lecture</strong><span>{activeLecture.title}</span></button>}

                    {/* Luminous Animated Border Beam */}
                    <div className="v3-player-border-glow" aria-hidden="true" />
                  </div>

                  {/* Lecture Meta & External Play Action */}
                  <div className="v3-lecture-meta-bar">
                    <div className="v3-lecture-meta-left">
                      <div className="v3-lecture-title-live">
                        {activeLecture.title}
                      </div>
                      <div className="v3-lecture-sub-live">
                        <span>{activeLecture.faculty}</span>
                        <span className="v3-dot-separator">•</span>
                        <span>{activeLecture.duration}</span>
                        <span className="v3-dot-separator">•</span>
                        <span className="v3-tag-pill">{activeLecture.badge}</span>
                      </div>
                    </div>

                    <a
                      href={bunnyDirectUrl}
                      referrerPolicy="no-referrer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="v3-direct-player-link"
                      title="Open full-screen Direct Player"
                    >
                      <span>Direct Player</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  {/* Equalizer Soundwave Animation Bar */}
                  <div className="v3-soundwave-row">
                    <div className="v3-soundwave-bars">
                      <span className="v3-bar v3-b1" />
                      <span className="v3-bar v3-b2" />
                      <span className="v3-bar v3-b3" />
                      <span className="v3-bar v3-b4" />
                      <span className="v3-bar v3-b5" />
                    </div>
                    <span className="v3-soundwave-text">
                      High-Yield Commentary Synced: {activeLecture.notes}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 2: Synced Samhita Commentary Key & PDF Download */}
              {activeTab === 'samhita' && (
                <div className="v3-samhita-tab-content">
                  
                  {/* Quick Lecture Switcher within Notes */}
                  <div className="v3-lecture-playlist-row">
                    <span className="v3-playlist-label">Active Samhita Notes:</span>
                    <div className="v3-playlist-buttons">
                      {FEATURED_LECTURES.map((lec) => (
                        <button
                          key={lec.id}
                          type="button"
                          className={`v3-playlist-btn ${activeLecture.id === lec.id ? 'active' : ''}`}
                          onClick={() => setActiveLecture(lec)}
                        >
                          <BookOpen size={13} />
                          <span>{lec.samhita.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Classical Shloka Box */}
                  <div className="v3-samhita-shloka-box">
                    <div className="v3-shloka-header-row">
                      <span className="v3-samhita-badge">{activeLecture.chapterRef}</span>
                      <span className="v3-samhita-topic">{activeLecture.shlokaTopic}</span>
                    </div>
                    <p className="v3-samhita-sanskrit-quote">
                      {activeLecture.sanskritShloka.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i === 0 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                    <p className="v3-samhita-english-rationale">
                      <strong>Clinical Breakdown:</strong> {activeLecture.clinicalBreakdown}
                    </p>
                  </div>

                  {/* High Yield Keypoints */}
                  <div className="v3-samhita-keypoints">
                    {activeLecture.highYieldPoints.map((pt, idx) => (
                      <div key={idx} className="v3-keypoint-item">
                        <CheckCircle2 size={16} color="#16A34A" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>

                  {/* Prominent Demo Notes Download Action */}
                  <div className="v3-notes-download-bar">
                    <div className="v3-notes-download-info">
                      <FileText size={20} className="v3-notes-icon" />
                      <div>
                        <div className="v3-notes-filename">{activeLecture.title} (Curriculum Demo)</div>
                        <div className="v3-notes-filesize">{activeLecture.pdfSize} • High-Yield AIAPGET Synoptic PDF</div>
                      </div>
                    </div>

                    <a
                      href={activeLecture.pdfUrl}
                      download={`${activeLecture.title.replace(/[^a-zA-Z0-9]/g, '_')}_Demo_Notes.pdf`}
                      className="v3-notes-download-btn"
                      title="Download high-yield lecture PDF notes"
                    >
                      <Download size={15} />
                      <span>Download Demo Notes (PDF)</span>
                    </a>
                  </div>

                </div>
              )}

              {/* TAB 3: Interactive AIAPGET MCQ Drill with Sleek Cards */}
              {activeTab === 'quiz' && (
                <div className="v3-quiz-tab-content">
                  
                  {/* Quick Lecture Switcher within Quiz */}
                  <div className="v3-lecture-playlist-row">
                    <span className="v3-playlist-label">Subject MCQ Drill:</span>
                    <div className="v3-playlist-buttons">
                      {FEATURED_LECTURES.map((lec) => (
                        <button
                          key={lec.id}
                          type="button"
                          className={`v3-playlist-btn ${activeLecture.id === lec.id ? 'active' : ''}`}
                          onClick={() => {
                            setActiveLecture(lec);
                            setShowInteractivePlayer(false);
                            setQuizAnswer(null);
                          }}
                        >
                          <HelpCircle size={13} />
                          <span>{lec.samhita.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="v3-quiz-card-box">
                    <div className="v3-quiz-header-row">
                      <div className="v3-quiz-question-badge">
                        <Award size={13} />
                        <span>{activeLecture.quiz.code} • NTA PATTERN</span>
                      </div>
                      {quizAnswer && (
                        <button
                          type="button"
                          onClick={() => setQuizAnswer(null)}
                          className="v3-quiz-reset-btn"
                          title="Reset question selection"
                        >
                          <RotateCcw size={12} />
                          <span>Try Again</span>
                        </button>
                      )}
                    </div>

                    <p className="v3-quiz-prompt">
                      {activeLecture.quiz.prompt}
                    </p>

                    <div className="v3-quiz-options-list">
                      {activeLecture.quiz.options.map((opt) => {
                        const isSelected = quizAnswer === opt.id;
                        const isSubmitted = quizAnswer !== null;
                        let optionClass = '';

                        if (isSelected) {
                          optionClass = opt.correct ? 'opt-selected-correct' : 'opt-selected-wrong';
                        } else if (isSubmitted && opt.correct) {
                          optionClass = 'opt-reveal-correct';
                        }

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setQuizAnswer(opt.id)}
                            className={`v3-quiz-option-card ${optionClass}`}
                          >
                            <span className="v3-quiz-opt-badge">{opt.id}</span>
                            <span className="v3-quiz-opt-text">{opt.text}</span>
                            <span className="v3-quiz-opt-indicator">
                              {isSelected && opt.correct && <Check size={18} color="#16A34A" />}
                              {isSelected && !opt.correct && <X size={18} color="#DC2626" />}
                              {!isSelected && isSubmitted && opt.correct && <Check size={16} color="#16A34A" />}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {quizAnswer && (
                      <div className={`v3-quiz-feedback-box ${quizAnswer === 'A' ? 'is-success' : 'is-error'}`}>
                        <div className="v3-feedback-title">
                          {quizAnswer === 'A' ? (
                            <>
                              <CheckCircle2 size={16} color="#16A34A" />
                              <span>Correct Answer! Concept Validated</span>
                            </>
                          ) : (
                            <>
                              <X size={16} color="#DC2626" />
                              <span>Incorrect Selection — Review Shastra Reference</span>
                            </>
                          )}
                        </div>
                        <p className="v3-feedback-desc">
                          <em>{activeLecture.quiz.referenceText}</em>. {activeLecture.quiz.rationale}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

        {/* Authentic Trust Ribbon with Official AIAPGET & Ayurveda Mortar Seals */}
        <div className="v3-trust-ribbon">
          <div className="v3-trust-item">
            <img
              src="/assets/home/aiapget-seal.webp"
              width="114" height="114" loading="lazy" decoding="async"
              alt="Official AIAPGET Entrance Emblem"
              className="v3-trust-seal-img"
            />
            <div className="v3-trust-text">
              <span className="v3-trust-head">AIAPGET Syllabus</span>
              <span className="v3-trust-sub">NTA-Pattern Mock Algorithms</span>
            </div>
          </div>

          <div className="v3-trust-divider" />

          <div className="v3-trust-item">
            <img
              src="/assets/home/ayur-mortar-emblem.webp"
              width="114" height="100" loading="lazy" decoding="async"
              alt="Ayurveda Khalva Yantra Mortar"
              className="v3-trust-seal-img v3-spin-slow"
            />
            <div className="v3-trust-text">
              <span className="v3-trust-head">Brihattrayi Authentic</span>
              <span className="v3-trust-sub">Charaka, Sushruta & Vagbhata</span>
            </div>
          </div>

          <div className="v3-trust-divider" />

          <div className="v3-trust-item">
            <div className="v3-trust-stat-num">10,000+</div>
            <div className="v3-trust-text">
              <span className="v3-trust-head">MCQ Question Bank</span>
              <span className="v3-trust-sub">Instant Rationales & Keys</span>
            </div>
          </div>

          <div className="v3-trust-divider" />

          <div className="v3-trust-item">
            <div className="v3-trust-stat-num">500+ Hrs</div>
            <div className="v3-trust-text">
              <span className="v3-trust-head">Full HD Video Vault</span>
              <span className="v3-trust-sub">Ultra-Fast Secure Streaming</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
