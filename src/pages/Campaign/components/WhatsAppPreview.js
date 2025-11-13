import React from 'react';
import { User } from 'lucide-react';
import { formatWhatsAppText, getPreviewText } from '../utils/whatsappFormatter';

export default function WhatsAppPreview({ selectedTemplate, variableValues }) {
  const text = getPreviewText(selectedTemplate, variableValues);
  const lines = text.split('\n');
  
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
        <div className="bg-[#005c4b] text-white px-3 py-2 rounded-lg rounded-tl-none max-w-[85%] shadow-md">
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
  );
}

