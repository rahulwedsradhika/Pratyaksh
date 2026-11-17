/**
 * Read-only source test-paper gateway for Vercel previews.
 *
 * No student credentials, cookies, or administrative tokens are copied or spoofed.
 * Protected upstream papers explicitly return 401/403.
 * Exam results are evaluated ephemerally against freshly fetched source answers.
 */
import { contentSourceHeaders, assertContentAuthorized } from './contentSourceAuth.js';
const PAPER_ID = /^[a-zA-Z0-9_-]{1,100}$/;
const LETTERS = ['A', 'B', 'C', 'D'];
const PAPER_ROUTES = [
  /^test-paper\/([a-zA-Z0-9_-]{1,100})$/,
  /^test-paper\/student\/([a-zA-Z0-9_-]{1,100})$/,
  /^practice-paper\/([a-zA-Z0-9_-]{1,100})$/,
  /^practice-paper\/student\/([a-zA-Z0-9_-]{1,100})$/,
  /^student\/quiz-practice\/([a-zA-Z0-9_-]{1,100})$/
];
const SUBMISSION_ROUTES = new Set(['test-response', 'test-response/student/startend']);

function baseUrl() {
  const url = new URL(process.env.PRATYAKSH_CONTENT_API_BASE || 'https://portal.pratyakshayurveda.in/api/');
  if (url.protocol !== 'https:') throw new Error('Source API must use HTTPS');
  return url.href.endsWith('/') ? url : new URL(url.href + '/');
}

export function matchPaperRoute(route) {
  if (typeof route !== 'string') return null;
  for (const pattern of PAPER_ROUTES) {
    const match = route.match(pattern);
    if (match) return { paperId: match[1], mode: route.includes('practice') ? 'practice' : 'exam' };
  }
  return null;
}
export function isExamSubmissionRoute(route) {
  return SUBMISSION_ROUTES.has(route);
}

function answerLetter(raw) {
  if (typeof raw === 'number' && raw >= 1 && raw <= 4) return LETTERS[raw - 1];
  if (typeof raw === 'string') {
    const value = raw.trim().toUpperCase();
    if (LETTERS.includes(value)) return value;
    if (/^[1-4]$/.test(value)) return LETTERS[Number(value)-1];
  }
  return null;
}

function richText(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    return typeof value.hindi === 'string' && value.hindi.trim()
      ? value.hindi
      : (typeof value.eng === 'string' ? value.eng : '');
  }
  return '';
}

function normalizeQuestions(payload, { includeAnswers = false } = {}) {
  return payload.questionList.map((q, index) => {
    const id = q?._id || q?.id;
    if (!id || !PAPER_ID.test(String(id))) throw new Error('Source paper contains an invalid question identifier');
    const english = typeof q.question === 'object' ? q.question?.eng || '' : '';
    const answer = answerLetter(q.correctOpt ?? q.correctOption);
    const item = {
      _id: String(id),
      index: index + 1,
      subject: Array.isArray(q.subjectTag) ? (q.subjectTag[0] || 'Ayurveda') : (q.subject || 'Ayurveda'),
      question: richText(q.question),
      questionEng: english,
      options: [q.opt1, q.opt2, q.opt3, q.opt4].map((option, idx) => ({
        key: LETTERS[idx],
        text: richText(option)
      }))
    };
    if (includeAnswers) {
      item.correctOption = answer;
      item.correctOpt = q.correctOpt ?? q.correctOption ?? null;
      item.explanation = typeof q.solution?.data === 'string' ? q.solution.data : '';
      item.samhitaReference = item.explanation;
    }
    return item;
  });
}

export function createLivePaperHandlers({ fetchImpl = globalThis.fetch, sourceToken = null } = {}) {
  async function retrieve(id) {
    if (!PAPER_ID.test(String(id))) {
      const error = new Error('Invalid paper identifier');
      error.httpStatus = 400;
      throw error;
    }
    const response = await fetchImpl(
      new URL('test-paper/student/' + encodeURIComponent(id), baseUrl()), {
        method: 'GET',
        headers: contentSourceHeaders(sourceToken),
        redirect: 'error',
        signal: AbortSignal.timeout(12000)
      }
    );
    if (!response.ok) {
      const error = new Error(response.status === 401 || response.status === 403
        ? 'This paper requires an authorized student session.'
        : 'The requested test paper is currently unavailable.');
      error.httpStatus = [401, 403, 404].includes(response.status) ? response.status : 502;
      throw error;
    }
    const body = await response.json();
    assertContentAuthorized(body);
    if (!body || body.status !== true || !body.data || !Array.isArray(body.data.questionList)) {
      const error = new Error('The source did not return a valid test paper.');
      error.httpStatus = 502;
      throw error;
    }
    if (body.data.questionList.length === 0) {
      const error = new Error('This test has no published questions.');
      error.httpStatus = 404;
      throw error;
    }
    if (body.data.questionList.length > 500) {
      const error = new Error('Paper exceeds the supported question limit.');
      error.httpStatus = 422;
      throw error;
    }
    return body.data;
  }

  function fail(res, error) {
    const code = Number(error?.httpStatus) || 503;
    return res.status(code).json({
      status: false,
      source: 'production-paper-api',
      code: [401, 403].includes(code) ? 'CONTENT_SOURCE_AUTH_REQUIRED' : 'CONTENT_SOURCE_UNAVAILABLE',
      message: error?.httpStatus ? error.message : 'Unable to load this test from the original source. Please retry.'
    });
  }

  async function getPaper(req, res, match) {
    try {
      const source = await retrieve(match.paperId);
      const questions = normalizeQuestions(source, { includeAnswers: match.mode === 'practice' });
      const positive = Number(source.perQMarks) || 4;
      const negative = Number(source.perQNegMarks) >= 0 ? Number(source.perQNegMarks) : 1;
      const duration = Number(source.durationMinutes || source.duration || 40);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('X-Content-Source', 'production-live');
      return res.json({
        status: true,
        source: 'production-live',
        data: {
          paper: {
            _id: source._id || match.paperId,
            title: source.title || source.name || 'Test Paper',
            durationMinutes: Number.isFinite(duration) && duration > 0 ? duration : 40,
            perQMarks: positive,
            perQNegMarks: negative,
            totalQuestions: questions.length,
            totalMarks: questions.length * positive,
            cutoff: Number(source.cutoff) || 0
          },
          questions
        }
      });
    } catch (error) {
      return fail(res, error);
    }
  }

  async function submit(req, res) {
    try {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return res.status(400).json({ status: false, message: 'Invalid submission payload.' });
      }
      const { paperId, answers, timeSpentSeconds } = body;
      if (!PAPER_ID.test(String(paperId || '')) || !answers || typeof answers !== 'object' ||
          Array.isArray(answers) || Object.keys(answers).length > 500) {
        return res.status(400).json({ status: false, message: 'Invalid paper or answers.' });
      }

      // Re-fetch from original source rather than trusting answers or scoring data from browser.
      const source = await retrieve(paperId);
      const questions = normalizeQuestions(source, { includeAnswers: true });
      if (questions.some(q => !q.correctOption)) {
        const error = new Error('This test does not have a complete published answer key.');
        error.httpStatus = 422;
        throw error;
      }

      const positive = Number(source.perQMarks) || 4;
      const negative = Number(source.perQNegMarks) >= 0 ? Number(source.perQNegMarks) : 1;
      let correctCount = 0, incorrectCount = 0, unattemptedCount = 0;
      const detailedReview = questions.map(q => {
        const selectedOption = answerLetter(answers[q._id]);
        const status = !selectedOption ? 'unattempted'
          : selectedOption === q.correctOption ? 'correct' : 'incorrect';
        if (status === 'correct') correctCount++;
        else if (status === 'incorrect') incorrectCount++;
        else unattemptedCount++;
        return {
          questionId: q._id,
          questionText: q.question,
          options: q.options,
          selectedOption,
          correctOption: q.correctOption,
          status,
          explanation: q.explanation,
          reference: q.samhitaReference
        };
      });
      const timeSpent = Number(timeSpentSeconds);
      return res.status(200).json({
        status: true,
        message: 'Exam evaluated for this browser session; not saved to a production student account.',
        data: {
          attemptId: 'preview-' + crypto.randomUUID(),
          score: correctCount * positive - incorrectCount * negative,
          totalMarks: questions.length * positive,
          accuracy: correctCount + incorrectCount ? Math.round(100 * correctCount / (correctCount + incorrectCount)) : 0,
          correctCount, incorrectCount, unattemptedCount,
          timeSpentSeconds: Number.isFinite(timeSpent) ? Math.min(86400, Math.max(0, Math.floor(timeSpent))) : 0,
          detailedReview
        }
      });
    } catch (error) {
      return fail(res, error);
    }
  }

  return { getPaper, submit };
}
