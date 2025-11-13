import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, Hash, ChevronDown, FileText } from 'lucide-react';
import ChatTemplateModal from '../../../component/Modals/ChatTemplateModal';

export default function TemplateSelector({
  selectedTemplate,
  setSelectedTemplate,
  variableValues,
  setVariableValues,
  variableSources,
  setVariableSources,
  excelHeaders = [],
  selectedContactDetails = [],
  audienceType = null
}) {
  const [openDropdowns, setOpenDropdowns] = useState({});
  const dropdownRefs = useRef({});
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [tokens, setTokens] = useState(null);

  // Load tokens from storage
  useEffect(() => {
    const loadTokens = () => {
      try {
        if (typeof window === 'undefined') return;

        const storages = [sessionStorage, localStorage];
        for (const storage of storages) {
          try {
            const data = storage?.getItem('userData');
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed && typeof parsed === 'object') {
                setTokens(parsed);
                return;
              }
            }
          } catch (storageError) {
            console.error('Failed to parse tokens from storage:', storageError);
          }
        }

        // Clear tokens if nothing found
        setTokens(null);
      } catch (e) {
        console.error('Failed to load tokens:', e);
      }
    };

    loadTokens();

    const handleStorageChange = (event) => {
      if (event.key === 'userData') {
        loadTokens();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleTemplateSelect = (template) => {
    // Convert API template format to campaign format
    const campaignTemplate = {
      id: template.id,
      name: template.name,
      category: template.category,
      content: extractTemplateContent(template.template_data),
      variables: extractVariables(template.template_data),
      approved: template.status === 'APPROVED',
      template_data: template.template_data,
      language: template.language
    };
    
    setSelectedTemplate(campaignTemplate);
    const newValues = {};
    campaignTemplate.variables.forEach(v => {
      newValues[v] = '';
    });
    setVariableValues(newValues);
    setVariableSources({});
    // Close all dropdowns when template changes
    setOpenDropdowns({});
  };

  // Extract template content from API format
  const extractTemplateContent = (templateData) => {
    if (!templateData?.components) return '';
    
    let content = '';
    templateData.components.forEach(component => {
      if (component.type === 'HEADER' && component.format === 'TEXT' && component.text) {
        content += component.text + '\n\n';
      }
      if (component.type === 'BODY' && component.text) {
        content += component.text + '\n';
      }
      if (component.type === 'FOOTER' && component.text) {
        content += '\n' + component.text;
      }
    });
    return content.trim();
  };

  // Extract variables from template
  const extractVariables = (templateData) => {
    if (!templateData?.components) return [];
    
    const variables = [];
    templateData.components.forEach(component => {
      // Handle BODY variables
      if (component.type === 'BODY' && component.text) {
        const matches = component.text.match(/\{\{\d+\}\}/g);
        if (matches) {
          matches.forEach((match) => {
            const varNum = match.match(/\d+/)[0];
            const varName = `var_${varNum}`;
            if (!variables.includes(varName)) {
              variables.push(varName);
            }
          });
        }
      }
      // Handle HEADER variables (text format)
      if (component.type === 'HEADER' && component.format === 'TEXT' && component.text) {
        const matches = component.text.match(/\{\{\d+\}\}/g);
        if (matches) {
          matches.forEach((match) => {
            const varNum = match.match(/\d+/)[0];
            const varName = `var_${varNum}`;
            if (!variables.includes(varName)) {
              variables.push(varName);
            }
          });
        }
      }
    });
    // Sort variables by number to maintain order
    return variables.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(openDropdowns).forEach(variable => {
        if (openDropdowns[variable] && dropdownRefs.current[variable] && 
            !dropdownRefs.current[variable].contains(event.target)) {
          setOpenDropdowns(prev => ({ ...prev, [variable]: false }));
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdowns]);

  const toggleDropdown = (variable) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [variable]: !prev[variable]
    }));
  };

  const contactFieldOptions = useMemo(() => {
    // Show contact variables for 'contacts' and 'groups' audience types
    const shouldShowContactOptions = audienceType === 'contacts' || audienceType === 'groups';
    if (!shouldShowContactOptions) return [];

    const firstContact = selectedContactDetails?.[0] || {};
    const options = [];

    // For groups, always show all contact variables even without contact details
    // For contacts, show variables based on available contact details
    const isGroup = audienceType === 'groups';

    // Contact name
    if (isGroup || firstContact?.name) {
      options.push({
        type: 'contact',
        key: 'contact.name',
        label: 'Name',
        sample: firstContact?.name || 'John Doe'
      });
    }

    // Contact number
    const contactNumber = firstContact?.number || firstContact?.phone;
    if (isGroup || contactNumber) {
      options.push({
        type: 'contact',
        key: 'contact.number',
        label: 'Number',
        sample: contactNumber || '1234567890'
      });
    }

    // Firm name
    if (isGroup || firstContact?.firm_name) {
      options.push({
        type: 'contact',
        key: 'contact.firm_name',
        label: 'Firm Name',
        sample: firstContact?.firm_name || 'Company Name'
      });
    }

    // Website
    if (isGroup || firstContact?.website) {
      options.push({
        type: 'contact',
        key: 'contact.website',
        label: 'Website',
        sample: firstContact?.website || 'www.example.com'
      });
    }

    // Email
    if (isGroup || firstContact?.email) {
      options.push({
        type: 'contact',
        key: 'contact.email',
        label: 'Email',
        sample: firstContact?.email || 'email@example.com'
      });
    }

    // Dynamic variables (always available for contacts and groups)
    const now = new Date();
    options.push({
      type: 'contact',
      key: 'contact.current_date',
      label: 'Current Date',
      sample: now.toLocaleDateString()
    });

    options.push({
      type: 'contact',
      key: 'contact.current_time',
      label: 'Current Time',
      sample: now.toLocaleTimeString()
    });

    options.push({
      type: 'contact',
      key: 'contact.current_day',
      label: 'Current Day',
      sample: now.toLocaleDateString('en-US', { weekday: 'long' })
    });

    return options;
  }, [selectedContactDetails, audienceType]);

  const allDropdownOptions = useMemo(() => {
    const excelOptions = excelHeaders.map((header) => ({
      type: 'excel',
      key: header,
      label: header,
      sample: header
    }));

    return [...contactFieldOptions, ...excelOptions];
  }, [contactFieldOptions, excelHeaders]);

  const hasDropdownOptions = allDropdownOptions.length > 0;

  const handleAutoFillOption = (variable, option) => {
    const previewValue = option.sample ?? '';
    setVariableValues(prev => ({
      ...prev,
      [variable]: previewValue
    }));
    setVariableSources(prev => ({
      ...prev,
      [variable]: {
        type: option.type,
        key: option.key
      }
    }));
    setOpenDropdowns(prev => ({ ...prev, [variable]: false }));
  };

  // Keep contact-based variables in sync with selected contacts
  useEffect(() => {
    if (!selectedTemplate) return;
    if (contactFieldOptions.length === 0) {
      let sourcesChanged = false;
      setVariableSources(prev => {
        const next = { ...prev };
        Object.keys(prev).forEach(variable => {
          if (prev[variable]?.type === 'contact') {
            delete next[variable];
            sourcesChanged = true;
          }
        });
        return sourcesChanged ? next : prev;
      });

      setVariableValues(prev => {
        const next = { ...prev };
        let changed = false;
        Object.entries(variableSources).forEach(([variable, source]) => {
          if (source?.type === 'contact' && next[variable]) {
            next[variable] = '';
            changed = true;
          }
        });
        return changed ? next : prev;
      });
      return;
    }

    setVariableValues(prev => {
      const next = { ...prev };
      let changed = false;
      Object.entries(variableSources).forEach(([variable, source]) => {
        if (source?.type === 'contact') {
          const option = contactFieldOptions.find(opt => opt.key === source.key);
          if (option && option.sample !== undefined && next[variable] !== option.sample) {
            next[variable] = option.sample;
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [contactFieldOptions, selectedTemplate, setVariableValues, variableSources]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Choose Your Template</h2>
      
      {/* Select Template Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowTemplateModal(true)}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <FileText className="w-5 h-5" />
          <span>Select Your Template</span>
        </button>
      </div>

      {/* Selected Template Display */}
      {selectedTemplate && (
        <div className="mb-6 p-4 rounded-lg border-2 border-indigo-500 bg-indigo-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <h3 className="font-semibold text-gray-800">{selectedTemplate.name}</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {selectedTemplate.category}
                </span>
                {selectedTemplate.approved && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Approved
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 whitespace-pre-line">{selectedTemplate.content.substring(0, 100)}...</p>
            </div>
            <Check className="w-6 h-6 text-indigo-600 flex-shrink-0 ml-2" />
          </div>
        </div>
      )}

      {selectedTemplate && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Map Template Variables</h3>
          {excelHeaders.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 Type a custom value or click the dropdown icon to select from Excel columns
              </p>
            </div>
          )}
          {contactFieldOptions.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">
                💡 You can auto-fill template variables with contact fields like name or number.
              </p>
            </div>
          )}
          <div className="space-y-4">
            {selectedTemplate.variables.map((variable, index) => {
              const varNumber = variable.match(/\d+/)?.[0] || (index + 1);
              return (
              <div key={variable}>
                <label htmlFor={variable} className="block text-sm font-medium text-gray-700 mb-2">
                  <Hash className="w-4 h-4 inline mr-2" />
                  {variable.replace('_', ' ').toUpperCase()} {`{{${varNumber}}}`}
                </label>
                <div className="relative">
                  <input
                    id={variable}
                    type="text"
                    value={variableValues[variable] || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setVariableValues(prev => ({ ...prev, [variable]: value }));
                      setVariableSources(prev => ({
                        ...prev,
                        [variable]: { type: 'manual' }
                      }));
                    }}
                    placeholder={`Enter ${variable.replace('_', ' ')}`}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {hasDropdownOptions && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleDropdown(variable)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                        aria-label="Select value"
                      >
                        <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${openDropdowns[variable] ? 'rotate-180' : ''}`} />
                      </button>
                      {openDropdowns[variable] && (
                        <div
                          ref={el => dropdownRefs.current[variable] = el}
                          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-72 overflow-y-auto"
                        >
                          <div className="p-2 space-y-2">
                            {contactFieldOptions.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wide">
                                  Contact Fields
                                </div>
                                {contactFieldOptions.map((option) => {
                                  const isSelected = variableSources[variable]?.type === 'contact' && variableSources[variable]?.key === option.key;
                                  return (
                                    <button
                                      key={option.key}
                                      type="button"
                                      onClick={() => handleAutoFillOption(variable, option)}
                                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between gap-3 ${
                                        isSelected ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-indigo-50'
                                      }`}
                                    >
                                      <div className="flex flex-col">
                                        <span>{option.label}</span>
                                        {option.sample && (
                                          <span className="text-xs text-gray-500">
                                            Sample: {option.sample}
                                          </span>
                                        )}
                                      </div>
                                      {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {excelHeaders.length > 0 && (
                              <div className="space-y-1">
                                <div className="text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wide">
                                  Excel Columns
                                </div>
                                {excelHeaders.map((header) => {
                                  const isSelected = variableSources[variable]?.type === 'excel' && variableSources[variable]?.key === header;
                                  const option = { type: 'excel', key: header, label: header, sample: header };
                                  return (
                                    <button
                                      key={header}
                                      type="button"
                                      onClick={() => handleAutoFillOption(variable, option)}
                                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                                        isSelected ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-indigo-50'
                                      }`}
                                    >
                                      <span>{header}</span>
                                      {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      <ChatTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        tokens={tokens}
        onTemplateSelect={handleTemplateSelect}
        darkMode={false}
      />
    </div>
  );
}

