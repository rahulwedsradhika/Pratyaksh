export function subjectImageSource(image) {
  if (typeof image !== 'string') return '';
  const value = image.trim();
  if (!value || value.startsWith('//')) return '';
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return '';
  return '/' + value.replace(/^\/+/, '');
}
