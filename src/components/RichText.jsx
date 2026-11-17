import React from 'react';
import {sanitizeLearningHtml} from '../services/safeHtml';

/**
 * RichText Component
 * Gracefully renders Devanagari Hindi/Sanskrit and English text that may contain
 * embedded HTML tags (e.g. <p>, <br>, <b>, &nbsp;) or plain text.
 */
export default function RichText({ content, className = '', style = {}, as: Tag = 'div' }) {
  if (content === null || content === undefined) return null;
  const str = String(content).trim();
  if (!str) return null;
  const readingClass = `learning-reading-content ${/[\u0900-\u097f]/.test(str) ? 'devanagari-text' : ''} ${className}`;

  // Check if string contains HTML markup or entities
  const hasHtml = /<[a-z][\s\S]*>|&[a-z0-9#]+;/i.test(str);

  if (hasHtml) {
    return (
      <Tag
        className={readingClass}
        style={style}
        dangerouslySetInnerHTML={{ __html: sanitizeLearningHtml(str) }}
      />
    );
  }

  return (
    <Tag className={readingClass} style={style}>
      {str}
    </Tag>
  );
}

