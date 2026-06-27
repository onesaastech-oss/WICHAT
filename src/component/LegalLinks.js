import React from 'react';
import { LEGAL_LINKS, websiteUrl } from '../config/website';

const LegalLinks = ({ className = '' }) => (
  <div className={`text-center ${className}`}>
    <p className="text-xs text-gray-500 mb-2">Legal &amp; Policies</p>
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
      {LEGAL_LINKS.map((link, index) => (
        <React.Fragment key={link.path}>
          {index > 0 && <span className="text-gray-300 hidden sm:inline">|</span>}
          <a
            href={websiteUrl(link.path)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            {link.label}
          </a>
        </React.Fragment>
      ))}
    </div>
  </div>
);

export default LegalLinks;
