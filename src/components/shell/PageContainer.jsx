import React from 'react';

export default function PageContainer({ children, maxWidth = '1200px', style = {} }) {
  return (
    <div style={{ maxWidth, margin: '0 auto', width: '100%', ...style }}>
      {children}
    </div>
  );
}

