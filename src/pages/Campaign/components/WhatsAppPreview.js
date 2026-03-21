import React from 'react';
import { User, FileText, Image, Video } from 'lucide-react';
import { formatWhatsAppText, getPreviewText } from '../utils/whatsappFormatter';

const getFileNameFromUrl = (url) => {
  if (!url) return 'Document';
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split('/').pop();
    return decodeURIComponent(last || 'Document');
  } catch {
    return 'Document';
  }
};

const getFileExtension = (name) => {
  if (!name) return 'FILE';
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toUpperCase() : 'FILE';
};

export default function WhatsAppPreview({ selectedTemplate, variableValues, variableSources = {}, headerMediaUrl = '' }) {
  const text = getPreviewText(selectedTemplate, variableValues, variableSources);
  const lines = text.split('\n');

  const headerComponent = selectedTemplate?.template_data?.components?.find((c) => c.type === 'HEADER');
  const headerFormat = (headerComponent?.format || 'NONE').toUpperCase();
  const requiresHeaderMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat);
  const headerUrl = headerMediaUrl || headerComponent?.example?.header_handle?.[0] || '';

  const renderHeaderPreview = () => {
    if (!requiresHeaderMedia || !headerUrl) return null;

    if (headerFormat === 'IMAGE') {
      return (
        <div className="w-full overflow-hidden bg-black/20 min-h-[120px]">
          <img
            src={headerUrl}
            alt="Header"
            className="w-full max-h-48 object-cover object-top"
            onError={(e) => {
              e.target.onError = null;
              e.target.style.display = 'none';
              const fallback = e.target.parentElement?.querySelector('.img-fallback');
              if (fallback) {
                fallback.classList.remove('hidden');
                fallback.classList.add('flex');
              }
            }}
          />
          <div className="img-fallback hidden w-full h-24 bg-gray-700/50 items-center justify-center gap-2 text-gray-400">
            <Image className="w-8 h-8" />
            <span className="text-sm">Image</span>
          </div>
        </div>
      );
    }

    if (headerFormat === 'VIDEO') {
      return (
        <div className="w-full overflow-hidden bg-black min-h-[120px]">
          <video
            src={headerUrl}
            className="w-full max-h-48 object-contain"
            controls
            playsInline
            onError={(e) => {
              e.target.onError = null;
              e.target.style.display = 'none';
              const fallback = e.target.parentElement?.querySelector('.video-fallback');
              if (fallback) {
                fallback.classList.remove('hidden');
                fallback.classList.add('flex');
              }
            }}
          >
            Your browser does not support the video tag.
          </video>
          <div className="video-fallback hidden w-full h-24 bg-gray-700/50 items-center justify-center gap-2 text-gray-400">
            <Video className="w-8 h-8" />
            <span className="text-sm">Video</span>
          </div>
        </div>
      );
    }

    if (headerFormat === 'DOCUMENT') {
      const fileName = getFileNameFromUrl(headerUrl);
      const ext = getFileExtension(fileName);
      return (
        <div className="w-full px-3 py-3 rounded-t-lg flex items-center gap-3 bg-[#0a3d32] border-b border-white/10">
          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-green-300" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{fileName}</div>
            <div className="text-xs text-green-200/80">{ext} • Document</div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-[#0b141a] p-4 rounded-lg max-w-md mx-auto">
      <div className="bg-[#128c7e] text-white px-4 py-3 rounded-t-lg flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <div className="font-semibold">Business Name</div>
          <div className="text-xs opacity-80">Typing...</div>
        </div>
      </div>

      <div className="bg-[#0b141a] p-4 min-h-[300px]">
        <div
          className={`bg-[#005c4b] text-white rounded-lg rounded-tl-none max-w-[85%] shadow-md overflow-hidden ${
            renderHeaderPreview() ? '' : 'px-3 py-2'
          }`}
        >
          {renderHeaderPreview()}
          <div className="px-3 py-2">
            <div className="text-[15px] leading-[1.4] whitespace-pre-wrap font-['Segoe_UI',_sans-serif]">
              {lines.map((line, idx) => (
                <React.Fragment key={idx}>
                  {formatWhatsAppText(line)}
                  {idx < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
            <div className="text-[11px] text-gray-300 mt-1 text-right">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

