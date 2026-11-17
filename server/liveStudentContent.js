/**
 * Read-only, live-first student catalog adapter.
 *
 * The source API is queried only through an explicit allowlist of GET endpoints.
 * No admin token, browser cookies, or other user credentials are forwarded.
 * Protected content must use a separate authorized entitlement-aware integration.
 */
import { contentSourceHeaders, assertContentAuthorized } from './contentSourceAuth.js';
const DEFAULT_API_BASE = 'https://portal.pratyakshayurveda.in/api/';
const VALID_MODES = new Set(['live-first', 'live-only', 'local']);
const ID = '[A-Za-z0-9_-]{1,100}';

function config() {
  const requested = process.env.PRATYAKSH_CONTENT_MODE || (process.env.NODE_ENV === 'production' ? 'live-only' : 'live-first');
  const mode = VALID_MODES.has(requested) ? requested : 'live-first';
  const base = process.env.PRATYAKSH_CONTENT_API_BASE || DEFAULT_API_BASE;
  const parsed = new URL(base);
  if (parsed.protocol !== 'https:') throw new Error('Live content API requires HTTPS');
  return {
    mode,
    base: parsed.toString().endsWith('/') ? parsed.toString() : parsed.toString() + '/',
    timeoutMs: 8000,
    ttlMs: 90000
  };
}

function matchRoute(path) {
  const simple = {
    '/api/category/active': 'categories',
    '/api/course': 'courses',
    '/api/course/active': 'activeCourses',
    '/api/student/myCourses': 'courses',
    '/api/test-series': 'series',
    '/api/student/myTestSeries': 'series',
    '/api/test-series/student': 'series'
  };
  if (simple[path]) return { kind: simple[path] };

  const routes = [
    [/^\/api\/(?:student\/mySubjects\/course|subject\/course)\/(ID)$/, 'subjects'],
    [/^\/api\/(?:student\/myChapters\/subject|chapter\/modules)\/(ID)$/, 'modules'],
    [/^\/api\/(?:student\/chapter-details|chapter-details)\/(ID)$/, 'chapter'],
    [/^\/api\/(?:student\/chapter-details|chapter-details)\/(ID)\/(ID)$/, 'chapterDual'],
    [/^\/api\/video\/chapter\/(ID)$/, 'videos'],
    [/^\/api\/notes\/chapter\/(ID)$/, 'notes'],
    [/^\/api\/lessons\/chapter\/(ID)$/, 'lessons'],
    [/^\/api\/(?:student\/myPaper|test-series\/paper|test-paper\/series)\/(ID)$/, 'papers'],
    [/^\/api\/course\/category\/(ID)$/, 'courseCategory'],
    [/^\/api\/course\/(?:allData\/)?(ID)$/, 'courseDetail']
  ];
  for (const [pattern, kind] of routes) {
    const resolved = new RegExp(pattern.source.replaceAll('ID', ID));
    const match = path.match(resolved);
    if (match) return { kind, id: match[match.length - 1] };
  }
  return null;
}

function entityId(row) {
  return row?._id || row?.id || '';
}

function normalizeCourse(course) {
  return { ...course, _id: entityId(course), img: course.img || '' };
}
function normalizeSubject(subject) {
  return {
    ...subject,
    _id: entityId(subject),
    courseID: subject.courseID || subject.course_id || '',
    chapterCount: subject.chapterCount ?? subject.chaptersCount ?? 0,
    chaptersCount: subject.chaptersCount ?? subject.chapterCount ?? 0
  };
}
function normalizeModule(module) {
  const chapters = Array.isArray(module.chapterID) ? module.chapterID
    : (Array.isArray(module.chapters) ? module.chapters : []);
  return {
    ...module,
    _id: entityId(module),
    chapters: chapters.filter(ch => ch && entityId(ch)).map(ch => ({
      ...ch,
      _id: entityId(ch),
      detail: ch.detail || ch.desc || '',
      img: ch.img || ''
    }))
  };
}
function normalizeVideo(video) {
  const bunnyID = video.bunnyID || video.bunny_id || '';
  const embed = video.secureEmbedUrl || video.secure_embed_url || '';
  return {
    ...video,
    _id: entityId(video),
    bunnyID,
    bunny_id: bunnyID,
    directPlayUrl: video.directPlayUrl || (bunnyID ? 'https://player.mediadelivery.net/play/330113/' + encodeURIComponent(bunnyID) : ''),
    secureEmbedUrl: embed,
    thumbnailUrl: video.thumbnailUrl || (bunnyID ? '/api/video/thumbnail/' + encodeURIComponent(bunnyID) : '')
  };
}
function normalizeNote(note) {
  const path = note.docPath || note.doc_path || '';
  return {
    ...note,
    _id: entityId(note),
    description: note.description || note.desc || '',
    docPath: path,
    docUrl: note.docUrl || (path ? (path.startsWith('https://') ? path : '/' + path.replace(/^\/+/, '')) : '')
  };
}
function normalizePaper(paper, seriesId) {
  const item = typeof paper === 'string' ? { _id: paper } : paper;
  if (!item || !entityId(item)) return null;
  return {
    ...item,
    _id: entityId(item),
    id: entityId(item),
    seriesId,
    title: item.title || item.name || '',
    name: item.name || item.title || '',
    durationMinutes: item.durationMinutes ?? item.duration ?? null,
    totalQuestions: item.totalQuestions ?? null
  };
}
function normalizeSeries(series) {
  const raw = Array.isArray(series.paperID) ? series.paperID
    : (Array.isArray(series.papers) ? series.papers : []);
  const papers = raw.map(p => normalizePaper(p, entityId(series))).filter(Boolean);
  return {
    ...series,
    _id: entityId(series),
    img: series.img || '',
    detail: series.detail || series.desc || '',
    papers,
    paperID: papers,
    paperCount: papers.length || series.paperCount || 0,
    totalPaper: papers.length || series.totalPaper || 0
  };
}

function requireArray(data, endpoint) {
  if (!Array.isArray(data)) throw new Error('Unexpected response shape for ' + endpoint);
  return data;
}

export function createStudentLiveMiddleware({ fetchImpl = globalThis.fetch, sourceToken = null } = {}) {
  const settings = config();
  const cache = new Map();
  let lastFetchAt = null;
  let lastErrorAt = null;

  async function read(endpoint, { publicCatalog = false } = {}) {
    const cached = cache.get(endpoint);
    if (publicCatalog && cached && cached.expiry > Date.now()) return cached.data;

    const response = await fetchImpl(new URL(endpoint, settings.base), {
      method: 'GET',
      headers: contentSourceHeaders(sourceToken),
      redirect: 'error',
      signal: AbortSignal.timeout(settings.timeoutMs)
    });

    if (!response.ok) {
      const err = new Error('Source API returned HTTP ' + response.status);
      err.status = response.status;
      throw err;
    }
    const payload = await response.json();
    assertContentAuthorized(payload);
    if (!payload || payload.status === false || !Object.prototype.hasOwnProperty.call(payload, 'data')) {
      throw new Error('Unexpected source response for ' + endpoint);
    }
    lastFetchAt = new Date().toISOString();
    if (publicCatalog) {
      if (cache.size >= 250) cache.delete(cache.keys().next().value);
      cache.set(endpoint, { data: payload.data, expiry: Date.now() + settings.ttlMs });
    }
    return payload.data;
  }

  async function get(kind, id) {
    switch (kind) {
      case 'categories':
        return requireArray(await read('category/active', { publicCatalog: true }), kind);
      case 'courses':
      case 'activeCourses': {
        const courses = requireArray(await read('course', { publicCatalog: true }), kind).map(normalizeCourse);
        return kind === 'activeCourses' ? courses.filter(c => c.isActive !== 0 && c.isActive !== false) : courses;
      }
      case 'courseCategory': {
        const courses = await get('courses');
        return courses.filter(c => {
          const category = c.categoryID || c.category_id;
          return (typeof category === 'object' ? entityId(category) : category) === id;
        });
      }
      case 'courseDetail': {
        const details = await read('course/allData/' + encodeURIComponent(id), { publicCatalog: true });
        if (!details || Array.isArray(details) || typeof details !== 'object') {
          throw new Error('Invalid course details from source API');
        }
        return normalizeCourse(details);
      }
      case 'subjects':
        return requireArray(await read('subject/course/' + encodeURIComponent(id), { publicCatalog: true }), kind).map(normalizeSubject);
      case 'modules':
        return requireArray(await read('sub-subject/chapter/active/' + encodeURIComponent(id), { publicCatalog: true }), kind)
          .map(normalizeModule);
      case 'videos':
        return requireArray(await read('video/chapter/' + encodeURIComponent(id)), kind).map(normalizeVideo);
      case 'notes':
        return requireArray(await read('notes/chapter/' + encodeURIComponent(id)), kind).map(normalizeNote);
      case 'lessons': {
        const [videos, notes] = await Promise.all([get('videos', id), get('notes', id)]);
        return videos.map((video, index) => ({
          ...video,
          videoUrl: video.secureEmbedUrl || '',
          notesUrl: notes[index]?.docUrl || '',
          duration: video.duration || '',
          order: index + 1
        }));
      }
      case 'chapter':
      case 'chapterDual': {
        const encoded = encodeURIComponent(id);
        const [chapter, videos, notes] = await Promise.all([
          read('chapter/' + encoded),
          get('videos', id),
          get('notes', id)
        ]);
        if (!chapter || Array.isArray(chapter) || typeof chapter !== 'object') {
          throw new Error('Invalid chapter details from source API');
        }
        return {
          ...chapter,
          _id: entityId(chapter) || id,
          id: entityId(chapter) || id,
          name: chapter.name || '',
          description: chapter.description || chapter.desc || '',
          practiceTestList: Array.isArray(chapter.practiceTestList) ? chapter.practiceTestList : [],
          videos,
          notes
        };
      }
      case 'series':
        return requireArray(await read('test-series', { publicCatalog: true }), kind).map(normalizeSeries);
      case 'papers': {
        const seriesList = await get('series');
        const series = seriesList.find(item => entityId(item) === id);
        if (!series) return [];
        return series.papers;
      }
      default:
        throw new Error('Unknown live content route');
    }
  }

  return async function studentLiveContent(req, res, next) {
    if (req.method !== 'GET') return next();

    if (req.path === '/api/content-sync/status') {
      res.setHeader('Cache-Control', 'no-store');
      return res.json({
        status: true,
        mode: settings.mode,
        lastFetchAt,
        lastErrorAt,
        source: 'configured-read-only-api'
      });
    }

    const match = matchRoute(req.path);
    if (!match || settings.mode === 'local') return next();

    try {
      const data = await get(match.kind, match.id);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Source', 'production-live');
      return res.json({ status: true, data, source: 'production-live' });
    } catch (error) {
      lastErrorAt = new Date().toISOString();
      if (error.status === 401 || error.status === 403) {
        const useLocalLectureSnapshot = process.env.PRATYAKSH_CONTENT_SNAPSHOT_ON_AUTH_DENIAL === 'true'
          && settings.mode === 'live-first'
          && ['videos', 'notes', 'lessons', 'chapter', 'chapterDual'].includes(match.kind);
        if (useLocalLectureSnapshot) {
          res.setHeader('X-Content-Source', 'local-snapshot');
          res.setHeader('X-Content-Stale', 'true');
          res.setHeader('Warning', '110 - "Provider denied live lecture data; serving the local snapshot"');
          return next();
        }
        res.setHeader('Cache-Control', 'no-store');
        return res.status(error.status).json({
          status: false,
          code: 'CONTENT_SOURCE_AUTH_REQUIRED',
          message: 'The original provider requires authorized access for this content.',
          source: 'production-auth-required'
        });
      }
      if (settings.mode === 'live-only') {
        return res.status(503).json({
          status: false,
          message: 'Live content is temporarily unavailable; retry shortly.',
          source: 'production-unavailable'
        });
      }
      // Keep development functional, but explicitly mark local data as a stale snapshot.
      res.setHeader('X-Content-Source', 'local-snapshot');
      res.setHeader('X-Content-Stale', 'true');
      res.setHeader('Warning', '110 - "Live curriculum unavailable; serving local snapshot"');
      return next();
    }
  };
}
