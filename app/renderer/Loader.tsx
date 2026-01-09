import React from 'react';
import './Loader.css';

const Loader: React.FC = () => {
  return (
    <div className="loader-container">
      <div className="loader-content">
        <div className="loader-logo">
          <div className="loader-icon">
            <div className="loader-spinner"></div>
          </div>
        </div>
        <h1 className="loader-title">Electron Platform</h1>
        <p className="loader-subtitle">Initializing application...</p>
        <div className="loader-progress">
          <div className="loader-progress-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
