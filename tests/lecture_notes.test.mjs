import test from 'node:test';
import assert from 'node:assert/strict';
import { notesForLecture } from '../src/services/lectureNotes.js';

test('legacy notes match the selected lecture title, never chapter position', () => {
  const lectures = [{ id: 'a', title: 'Orientation' }, { id: 'b', title: 'Blueprint' }, { id: 'c', title: 'Session' }];
  const notes = [{ id: 'n2', title: 'Blueprint\t' }, { id: 'n1', title: 'Orientation' }];
  assert.deepEqual(notesForLecture(lectures[0], notes, lectures).map((n) => n.id), ['n1']);
  assert.deepEqual(notesForLecture(lectures[1], notes, lectures).map((n) => n.id), ['n2']);
  assert.deepEqual(notesForLecture(lectures[2], notes, lectures), []);
  assert.deepEqual(notesForLecture(null, notes, lectures), []);
});

test('explicit links take precedence over matching titles', () => {
  const lecture = { id: 'a', title: 'Orientation' };
  const notes = [{ id: 'n1', title: 'Orientation', videoId: 'b' }, { id: 'n2', title: 'Handout', lectureId: 'a' }];
  assert.deepEqual(notesForLecture(lecture, notes, [lecture]).map((n) => n.id), ['n2']);
});

test('ambiguous lecture titles do not share unlinked notes', () => {
  const lectures = [{ id: 'a', title: 'Lecture' }, { id: 'b', title: 'Lecture' }];
  assert.deepEqual(notesForLecture(lectures[0], [{ id: 'n', title: 'Lecture' }], lectures), []);
});

test('generic PDF titles use the precise lecture description without leaking to other lectures', () => {
  const lectures = [{ id: 'a', title: 'Charaka Sutra 2, 3 (NExT)' }, { id: 'b', title: 'Charaka Sutra 4, 5 (NExT)' }, { id: 'c', title: 'Charaka Sutra' }];
  const notes = [{ id: 'n1', title: 'Charaka Sutra ', description: 'Charaka Sutra 2, 3 (NExT)' }, { id: 'n2', title: 'Charaka Sutra ', description: 'Charaka Sutra 4, 5 (NExT)' }];
  assert.deepEqual(notesForLecture(lectures[0], notes, lectures).map((n) => n.id), ['n1']);
  assert.deepEqual(notesForLecture(lectures[1], notes, lectures).map((n) => n.id), ['n2']);
  assert.deepEqual(notesForLecture(lectures[2], notes, lectures), []);
});
