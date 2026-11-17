import DOMPurify from 'dompurify';
export function sanitizeLearningHtml(value) {
  return DOMPurify.sanitize(String(value),{
    USE_PROFILES:{html:true},
    FORBID_TAGS:['iframe','object','embed','form','input','button','style','link','meta'],
    FORBID_ATTR:['srcdoc']
  });
}
