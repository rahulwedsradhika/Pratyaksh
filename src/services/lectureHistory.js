import { studentFetch } from './studentFetch';

export async function saveLectureHistory({ lectureId, chapterId, positionSeconds }) {
  const response = await studentFetch('/api/student/activity/lecture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify({ lectureId, chapterId, positionSeconds })
  });
  const body = await response.json();
  if (!response.ok || !body.status) throw new Error('Your lecture history could not be saved. Please refresh and try again.');
  window.dispatchEvent(new Event('student-activity-saved'));
}
