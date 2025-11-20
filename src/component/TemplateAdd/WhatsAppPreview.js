import React, { useState, useRef, useEffect } from 'react';
import {
  FiChevronDown,
  FiX,
  FiPlus,
  FiPaperclip,
  FiLink,
  FiPhone,
  FiMessageSquare,
  FiCopy,
  FiMapPin,
  FiBold,
  FiItalic,
  FiUnderline,
  FiCode,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiFileText
} from 'react-icons/fi';
import { BsCheckAll } from 'react-icons/bs';

// Enhanced WhatsApp Preview Component
const EnhancedWhatsAppPreview = ({ 
  formData, 
  bodyVariables, 
  darkMode = false 
}) => {
  const getFileNameFromUrl = (url) => {
    if (!url) return 'document';
    try {
      const pathname = new URL(url).pathname;
      const last = pathname.split('/').pop();
      return decodeURIComponent(last || 'document');
    } catch (e) {
      return 'document.pdf';
    }
  };

  const getFileExtension = (name) => {
    if (!name) return '';
    const match = name.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : 'FILE';
  };

  const generatePreviewText = (text, variables) => {
    let preview = text;
    variables.forEach((v, i) => {
      const varNumber = i + 1;
      preview = preview.replace(
        new RegExp(`\\{\\{${varNumber}\\}\\}`, 'g'),
        v.sample || `{{${varNumber}}}`
      );
    });
    return preview;
  };

  const formatTextForPreview = (text) => {
    if (!text) return '';
    return text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/~(.*?)~/g, '<s>$1</s>')
      .replace(/```(.*?)```/gs, '<code>$1</code>');
  };

  const headerFormat = formData.components.header.format;
  const requiresHeaderMedia = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerFormat);
  const headerMediaUrl = formData.components.header.example?.header_handle?.[0] || '';
  const buttons = formData.components.buttons.buttons || [];
  const footerText = formData.components.footer.text;

  return (
    <div className={`w-full flex flex-col ${darkMode ? 'bg-[#0b141a]' : 'bg-[#efeae2]'} relative rounded-lg overflow-hidden max-h-[500px]`}>
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
          backgroundRepeat: 'repeat'
        }}
      />

      {/* Header */}
      <div className={`relative z-10 flex items-center gap-3 px-4 py-3 ${
        darkMode ? 'bg-[#202c33] text-white' : 'bg-[#008069] text-white'
      } shadow-sm`}>
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center bg-white/20 text-lg font-medium">
            C
          </div>
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm truncate">Customer Name</div>
          <div className="text-xs opacity-80">online</div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="overflow-y-auto p-4 relative z-10 flex flex-col h-full">
        {/* Date Badge */}
        <div className="flex justify-center mb-4">
          <span className={`text-xs px-3 py-1.5 rounded-lg shadow-sm ${
            darkMode ? 'bg-[#182229] text-gray-300' : 'bg-white text-gray-600'
          }`}>
            Today
          </span>
        </div>

        {/* Message Bubble */}
        <div className="flex justify-end w-full">
          <div className={`
            relative max-w-[320px] rounded-lg shadow-sm flex flex-col
            ${darkMode ? 'bg-[#005c4b]' : 'bg-[#d9fdd3]'}
          `}>
            {/* WhatsApp Tail */}
            <span className="absolute top-0 -right-[8px] w-[8px] h-[13px] overflow-hidden">
              <svg viewBox="0 0 8 13" width="8" height="13" className={`w-full h-full fill-current ${
                darkMode ? 'text-[#005c4b]' : 'text-[#d9fdd3]'
              }`}>
                <path opacity="0.13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
                <path d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z" />
              </svg>
            </span>

            {/* Header Media */}
            {requiresHeaderMedia && headerMediaUrl && (
              <div className="p-1 pb-0">
                {(() => {
                  const url = headerMediaUrl;
                  const isPdf = url.toLowerCase().includes('.pdf') || headerFormat === 'DOCUMENT';
                  const isVideo = headerFormat === 'VIDEO';

                  if (!isPdf) {
                    return (
                      <div className="w-full h-40 sm:h-48 bg-black/10 rounded-lg overflow-hidden relative">
                        {isVideo ? (
                          <video src={url} className="w-full h-full object-cover" controls={false} />
                        ) : (
                          <img src={url} alt="Header" className="w-full h-full object-cover" />
                        )}
                      </div>
                    );
                  }

                  const fileName = getFileNameFromUrl(url);
                  const ext = getFileExtension(fileName).toUpperCase();
                  return (
                    <div className={`rounded-lg overflow-hidden flex items-center h-20 ${
                      darkMode ? 'bg-[#233039]' : 'bg-[#f5fcf4]'
                    } relative`}>
                      <div className="w-14 h-full flex items-center justify-center">
                        <FiFileText className={`w-8 h-8 ${
                          darkMode ? 'text-red-400' : 'text-red-500'
                        }`} />
                      </div>
                      <div className="flex-1 pr-3 overflow-hidden">
                        <div className={`text-sm font-medium truncate ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {fileName}
                        </div>
                        <div className={`text-xs ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {ext} • 1 page
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Header Text */}
            {headerFormat === 'TEXT' && formData.components.header.text && (
              <div className="px-2 pt-2">
                <div className={`text-[14.2px] font-semibold ${
                  darkMode ? 'text-white' : 'text-[#111b21]'
                }`}>
                  {formData.components.header.text}
                </div>
              </div>
            )}

            {/* Content Wrapper */}
            <div className="px-2 pt-2 pb-3">
              {/* Body Text */}
              <div 
                className={`text-[14.2px] leading-[19px] whitespace-pre-wrap ${
                  darkMode ? 'text-white' : 'text-[#111b21]'
                }`}
                dangerouslySetInnerHTML={{
                  __html: bodyVariables.length > 0
                    ? formatTextForPreview(generatePreviewText(formData.components.body.text, bodyVariables))
                    : formatTextForPreview(formData.components.body.text) || "Your message will appear here..."
                }}
              />

              {/* Metadata */}
              <div className="flex items-center justify-end gap-1 mt-1">
                <span className={`text-[11px] ${
                  darkMode ? 'text-gray-400' : 'text-[#667781]'
                }`}>
                  {new Date().toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    hour12: true 
                  })}
                </span>
                <BsCheckAll className={`text-[16px] ${
                  darkMode ? 'text-[#53bdeb]' : 'text-[#53bdeb]'
                }`} />
              </div>

              {/* Footer Text */}
              {footerText && (
                <div className={`text-[13px] mt-1 opacity-60 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {footerText}
                </div>
              )}
            </div>

            {/* Buttons */}
            {buttons.length > 0 && (
              <div className={`w-full flex flex-col rounded-b-lg overflow-hidden border-t ${
                darkMode 
                  ? 'border-white/10 bg-[#202c33]/30' 
                  : 'border-[#0000000d] bg-[#f0f2f5]/30'
              }`}>
                {buttons.map((btn, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`
                      w-full py-3 px-4 text-center 
                      text-[#00a5f4] text-[15px] font-medium 
                      cursor-pointer transition-colors
                      hover:bg-black/5 dark:hover:bg-white/5
                      flex items-center justify-center gap-2
                      ${idx !== 0 ? `border-t ${
                        darkMode ? 'border-white/10' : 'border-[#0000000d]'
                      }` : ''}
                    `}
                  >
                    {btn.type === 'URL' && <span className="text-xs">↗</span>}
                    {btn.type === 'PHONE_NUMBER' && <span className="text-xs">📞</span>}
                    {btn.text || 'Button'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className={`p-3 flex items-center gap-3 relative z-10 ${
        darkMode ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'
      }`}>
        <div className={`p-2 rounded-full ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>+</div>
        <div className={`flex-1 py-2 px-4 rounded-lg ${
          darkMode ? 'bg-[#2a3942] text-gray-300' : 'bg-white text-gray-500'
        } text-sm`}>
          Type a message
        </div>
        <div className={`p-2 rounded-full ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>🎙️</div>
      </div>
    </div>
  );
};

// Export the actual preview component that accepts props
export default EnhancedWhatsAppPreview;