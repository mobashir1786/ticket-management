import React from 'react';

export default function LoadingIndicator({ children }) {
  return <span className="loading-indicator" role="status">
    <span className="spinner" aria-hidden="true" />
    {children}
  </span>;
}
