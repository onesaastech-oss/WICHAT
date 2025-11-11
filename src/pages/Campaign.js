import React, { useState, useEffect } from 'react';
import { Upload, Users, FileSpreadsheet, Link2, Send, ChevronRight, Phone, User, Hash, Check, X, Menu, Search, Bell, LifeBuoy, Settings, LogOut, Package, MessageSquare } from 'lucide-react';

import { Header, Sidebar } from '../component/Menu';

export default function CampaignBuilder() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('audience');
  const [audienceType, setAudienceType] = useState(null);
  const [excelMapping, setExcelMapping] = useState({ name: '', phone: '' });
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [variableValues, setVariableValues] = useState({});
  const [sheetLink, setSheetLink] = useState('');

  const [isMinimized, setIsMinimized] = useState(() => {
    // Note: localStorage might not be available in all environments (like SSR)
    // Adding a check to prevent errors.
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('sidebarMinimized');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
    }
  }, [isMinimized]);

  // Dummy data
  const contacts = [
    { id: 1, name: 'John Doe', phone: '+1234567890', status: 'active' },
    { id: 2, name: 'Jane Smith', phone: '+0987654321', status: 'active' },
    { id: 3, name: 'Bob Johnson', phone: '+1122334455', status: 'active' },
    { id: 4, name: 'Alice Williams', phone: '+5544332211', status: 'active' },
  ];

  const contactGroups = [
    { id: 1, name: 'VIP Customers', count: 150, color: 'bg-purple-500' },
    { id: 2, name: 'Newsletter Subscribers', count: 430, color: 'bg-blue-500' },
    { id: 3, name: 'New Leads', count: 89, color: 'bg-green-500' },
    { id: 4, name: 'Premium Members', count: 220, color: 'bg-yellow-500' },
  ];

  const templates = [
    {
      id: 1,
      name: 'Welcome Message',
      category: 'Marketing',
      content: 'Hi {{1}},\n\nWelcome to {{2}}! 🎉\n\nWe\'re excited to have you with us. Get started with 20% off your first order using code: *WELCOME20*\n\nShop now: {{3}}',
      variables: ['name', 'company', 'link'],
      approved: true
    },
    {
      id: 2,
      name: 'Order Confirmation',
      category: 'Transactional',
      content: 'Hello {{1}},\n\nYour order #{{2}} has been confirmed! ✅\n\nTotal: ${{3}}\nExpected delivery: {{4}}\n\nTrack your order: {{5}}',
      variables: ['name', 'order_id', 'amount', 'date', 'tracking_link'],
      approved: true
    },
    {
      id: 3,
      name: 'Appointment Reminder',
      category: 'Utility',
      content: 'Hi {{1}},\n\nThis is a reminder about your appointment:\n\n📅 Date: {{2}}\n🕐 Time: {{3}}\n📍 Location: {{4}}\n\nSee you soon!',
      variables: ['name', 'date', 'time', 'location'],
      approved: true
    }
  ];

  const getPreviewText = () => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.content;
    selectedTemplate.variables.forEach((variable, index) => {
      const value = variableValues[variable] || `{{${index + 1}}}`;
      text = text.replace(new RegExp(`{{\\s*${index + 1}\\s*}}`, 'g'), value);
    });
    return text;
  };

  const formatWhatsAppText = (text) => {
    const parts = [];
    let currentIndex = 0;
    
    // Parse bold (*text*)
    const boldRegex = /\*(.*?)\*/g;
    let match;
    
    const segments = [];
    let lastIndex = 0;
    
    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'normal', text: text.slice(lastIndex, match.index) });
      }
      segments.push({ type: 'bold', text: match[1] });
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      segments.push({ type: 'normal', text: text.slice(lastIndex) });
    }
    
    return segments.map((segment, idx) => {
      if (segment.type === 'bold') {
        return <strong key={idx} className="font-semibold">{segment.text}</strong>;
      }
      return <span key={idx}>{segment.text}</span>;
    });
  };

  const renderWhatsAppPreview = () => {
    const text = getPreviewText();
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
  };

  const canProceed = () => {
    if (activeTab === 'audience') {
      if (audienceType === 'contacts') return selectedContacts.length > 0;
      if (audienceType === 'excel') return excelMapping.name && excelMapping.phone; // Simplified for demo
      if (audienceType === 'sheet') return sheetLink.trim() !== '' && excelMapping.name && excelMapping.phone;
      if (audienceType === 'groups') return selectedGroups.length > 0;
      return false;
    }
    if (activeTab === 'template') {
      if (!selectedTemplate) return false;
      return selectedTemplate.variables.every(v => variableValues[v] && variableValues[v].trim() !== '');
    }
    return false;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isMinimized={isMinimized}
        setIsMinimized={isMinimized}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isMinimized ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <Header
          setMobileMenuOpen={setMobileMenuOpen}
        />
        
        <main className="mt-16 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-600 bg-clip-text text-transparent">
                    Create Campaign
                  </h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">Build and send your WhatsApp campaign in 2 simple steps</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                  <div className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'audience' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                    <Users className="w-4 h-4" />
                    <span className="font-medium text-sm sm:text-base">1. Audience</span>
                  </div>
                  <ChevronRight className="w-6 h-6 text-gray-300 self-center flex-shrink-0" />
                  <div className={`px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${activeTab === 'template' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                    <Send className="w-4 h-4" />
                    <span className="font-medium text-sm sm:text-base">2. Template</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {activeTab === 'audience' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Select Your Audience</h2>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <button
                        onClick={() => setAudienceType('contacts')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          audienceType === 'contacts'
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <Users className={`w-8 h-8 mb-3 ${audienceType === 'contacts' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <div className="font-semibold text-gray-800">From Contacts</div>
                        <div className="text-sm text-gray-500 mt-1">Select individual contacts</div>
                      </button>

                      <button
                        onClick={() => setAudienceType('excel')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          audienceType === 'excel'
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <FileSpreadsheet className={`w-8 h-8 mb-3 ${audienceType === 'excel' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <div className="font-semibold text-gray-800">Upload Excel</div>
                        <div className="text-sm text-gray-500 mt-1">Import from Excel file</div>
                      </button>

                      <button
                        onClick={() => setAudienceType('sheet')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          audienceType === 'sheet'
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <Link2 className={`w-8 h-8 mb-3 ${audienceType === 'sheet' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <div className="font-semibold text-gray-800">Google Sheet</div>
                        <div className="text-sm text-gray-500 mt-1">Connect via link</div>
                      </button>

                      <button
                        onClick={() => setAudienceType('groups')}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          audienceType === 'groups'
                            ? 'border-indigo-500 bg-indigo-50 shadow-md'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <Users className={`w-8 h-8 mb-3 ${audienceType === 'groups' ? 'text-indigo-600' : 'text-gray-400'}`} />
                        <div className="font-semibold text-gray-800">Contact Groups</div>
                        <div className="text-sm text-gray-500 mt-1">Select predefined groups</div>
                      </button>
                    </div>

                    {audienceType === 'contacts' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-700">Select Contacts ({selectedContacts.length} selected)</h3>
                          <button
                            onClick={() => setSelectedContacts(selectedContacts.length === contacts.length ? [] : contacts.map(c => c.id))}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            {selectedContacts.length === contacts.length ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                        {contacts.map(contact => (
                          <div
                            key={contact.id}
                            onClick={() => {
                              setSelectedContacts(prev =>
                                prev.includes(contact.id)
                                  ? prev.filter(id => id !== contact.id)
                                  : [...prev, contact.id]
                              );
                            }}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedContacts.includes(contact.id)
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  selectedContacts.includes(contact.id) ? 'bg-indigo-500' : 'bg-gray-200'
                                }`}>
                                  {selectedContacts.includes(contact.id) ? (
                                    <Check className="w-5 h-5 text-white" />
                                  ) : (
                                    <User className="w-5 h-5 text-gray-500" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800">{contact.name}</div>
                                  <div className="text-sm text-gray-500">{contact.phone}</div>
                                </div>
                              </div>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                {contact.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {audienceType === 'excel' && (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <div className="font-medium text-gray-700 mb-1">Upload Excel File</div>
                          <div className="text-sm text-gray-500">Click to browse or drag and drop</div>
                          <div className="text-xs text-gray-400 mt-2">Supported: .xlsx, .xls, .csv</div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="font-semibold text-gray-700 mb-4">Map Your Columns</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Phone Number Column
                              </label>
                              <input
                                type="text"
                                value={excelMapping.phone}
                                onChange={(e) => setExcelMapping({...excelMapping, phone: e.target.value})}
                                placeholder="e.g., A or 1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Name Column
                              </label>
                              <input
                                type="text"
                                value={excelMapping.name}
                                onChange={(e) => setExcelMapping({...excelMapping, name: e.target.value})}
                                placeholder="e.g., B or 2"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {audienceType === 'sheet' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Google Sheet Link
                          </label>
                          <input
                            type="url"
                            value={sheetLink}
                            onChange={(e) => setSheetLink(e.target.value)}
                            placeholder="https://docs.google.com/spreadsheets/d/..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <p className="text-xs text-gray-500 mt-2">Make sure the sheet is publicly accessible</p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="font-semibold text-gray-700 mb-4">Map Your Columns</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Phone Number Column
                              </label>
                              <input
                                type="text"
                                value={excelMapping.phone}
                                onChange={(e) => setExcelMapping({...excelMapping, phone: e.target.value})}
                                placeholder="e.g., A or 1"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Name Column
                              </label>
                              <input
                                type="text"
                                value={excelMapping.name}
                                onChange={(e) => setExcelMapping({...excelMapping, name: e.target.value})}
                                placeholder="e.g., B or 2"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {audienceType === 'groups' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-gray-700">Select Groups ({selectedGroups.length} selected)</h3>
                        </div>
                        {contactGroups.map(group => (
                          <div
                            key={group.id}
                            onClick={() => {
                              setSelectedGroups(prev =>
                                prev.includes(group.id)
                                  ? prev.filter(id => id !== group.id)
                                  : [...prev, group.id]
                              );
                            }}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              selectedGroups.includes(group.id)
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${group.color} rounded-full flex items-center justify-center`}>
                                  <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800">{group.name}</div>
                                  <div className="text-sm text-gray-500">{group.count} contacts</div>
                                </div>
                              </div>
                              {selectedGroups.includes(group.id) && (
                                <Check className="w-6 h-6 text-indigo-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'template' && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Choose Your Template</h2>
                    
                    <div className="space-y-4 mb-6">
                      {templates.map(template => (
                        <div
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template);
                            const newValues = {};
                            template.variables.forEach(v => {
                              newValues[v] = '';
                            });
                            setVariableValues(newValues);
                          }}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedTemplate?.id === template.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-indigo-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <h3 className="font-semibold text-gray-800">{template.name}</h3>
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {template.category}
                                </span>
                                {template.approved && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Approved
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 whitespace-pre-line">{template.content.substring(0, 100)}...</p>
                            </div>
                            {selectedTemplate?.id === template.id && (
                              <Check className="w-6 h-6 text-indigo-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedTemplate && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-700 mb-4">Map Template Variables</h3>
                        <div className="space-y-4">
                          {selectedTemplate.variables.map((variable, index) => (
                            <div key={variable}>
                              <label htmlFor={variable} className="block text-sm font-medium text-gray-700 mb-2">
                                <Hash className="w-4 h-4 inline mr-2" />
                                {variable.replace('_', ' ').toUpperCase()} {`{{${index + 1}}}`}
                              </label>
                              <input
                                id={variable}
                                type="text"
                                value={variableValues[variable] || ''}
                                onChange={(e) => setVariableValues({...variableValues, [variable]: e.target.value})}
                                placeholder={`Enter ${variable}`}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {activeTab === 'template' && selectedTemplate && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h3 className="font-semibold text-gray-800 mb-4">WhatsApp Preview</h3>
                    {renderWhatsAppPreview()}
                  </div>
                )}

                <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Campaign Summary</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500">Audience</div>
                      <div className="font-medium text-gray-800">
                        {!audienceType && 'Not selected'}
                        {audienceType === 'contacts' && `${selectedContacts.length} contacts`}
                        {audienceType === 'excel' && (excelMapping.phone && excelMapping.name ? 'Excel file mapped' : 'Mapping required')}
                        {audienceType === 'sheet' && (sheetLink && excelMapping.phone && excelMapping.name ? 'Sheet connected' : 'Configuration required')}
                        {audienceType === 'groups' && `${selectedGroups.length} groups`}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-500">Template</div>
                      <div className="font-medium text-gray-800">
                        {selectedTemplate ? selectedTemplate.name : 'Not selected'}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      {activeTab === 'audience' && (
                        <button
                          onClick={() => setActiveTab('template')}
                          disabled={!canProceed()}
                          className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                            canProceed()
                              ? 'bg-gradient-to-r from-indigo-500 to-indigo-500 text-white hover:from-indigo-600 hover:to-indigo-600 shadow-lg hover:shadow-xl'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Next: Choose Template
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}

                      {activeTab === 'template' && (
                        <div className="space-y-3">
                          <button
                            onClick={() => setActiveTab('audience')}
                            className="w-full py-3 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                          >
                            Back to Audience
                          </button>
                          <button
                            disabled={!canProceed()}
                            className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                              canProceed()
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-500 text-white hover:from-indigo-600 hover:to-indigo-600 shadow-lg hover:shadow-xl'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Send className="w-5 h-5" />
                            Launch Campaign
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}