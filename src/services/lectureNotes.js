const idOf = item => String(item?._id || item?.id || '');
const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
const titleOf = item => normalize(item?.title);

// Older content has no relation IDs. Only an unambiguous exact title match
// may associate those notes; chapter membership or list order is insufficient.
export function notesForLecture(lecture, notes, lectures) {
  if (!lecture) return [];
  const lectureId = idOf(lecture);
  const noteIds = [lecture.noteId, lecture.notesId, ...(Array.isArray(lecture.noteIds) ? lecture.noteIds : [])]
    .filter(Boolean).map(String);
  const title = titleOf(lecture);
  const uniqueTitle = title && lectures.filter(item => titleOf(item) === title).length === 1;
  return notes.filter(note => {
    const linkedLecture = note.lectureId || note.lectureID || note.lecture_id || note.videoId || note.videoID || note.video_id;
    if (linkedLecture) return String(linkedLecture?._id || linkedLecture?.id || linkedLecture) === lectureId;
    if (noteIds.length) return noteIds.includes(idOf(note));
    const description = normalize(note.description || note.desc);
    // Some PDFs have a generic title and put the precise lecture name in
    // their description. Prefer that association over the generic title.
    if (description && lectures.some(item => titleOf(item) === description)) {
      return Boolean(uniqueTitle && description === title);
    }
    return Boolean(uniqueTitle && titleOf(note) === title);
  });
}
