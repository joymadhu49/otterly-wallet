import React from 'react';

export const BrandLoader: React.FC<{ label?: string }> = ({ label = 'Loading' }) => (
  <div className="otterly-loader">
    <div className="otterly-loader__badge">
      <div className="otterly-loader__halo" />
      <img className="otterly-loader__logo" src="assets/icon-128.png" alt="Otterly" />
    </div>
    <div className="otterly-loader__dots">
      <span className="otterly-loader__dot" />
      <span className="otterly-loader__dot" />
      <span className="otterly-loader__dot" />
    </div>
    {label && <div className="otterly-loader__label">{label}</div>}
  </div>
);
