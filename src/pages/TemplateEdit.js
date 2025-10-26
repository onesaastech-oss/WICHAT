import React, { useState, useRef, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  FiArrowLeft,
  FiSave
} from 'react-icons/fi';

function TemplateEdit() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    language: '',
    components: {
      header: {
        type: 'HEADER',
        format: 'NONE',
        text: '',
        example: { header_handle: [] }
      },
      body: {
        type: 'BODY',
        text: '',
        example: { body_text: [] }
      },
      footer: {
        type: 'FOOTER',
        text: ''
      },
      buttons: {
        type: 'BUTTONS',
        buttons: []
      }
    }
  });
  const [bodyVariables, setBodyVariables] = useState([]);
  const [headerVariable, setHeaderVariable] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  // Get user tokens from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsedData = JSON.parse(userData);
      setTokens(parsedData);
    }
  }, []);

  // Language options
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'zh', name: 'Chinese' }
  ];

  // Categories
  const categories = [
    { code: 'MARKETING', name: 'Marketing' },
    { code: 'TRANSACTIONAL', name: 'Transactional' },
    { code: 'UTILITY', name: 'Utility' },
    { code: 'AUTHENTICATION', name: 'Authentication' }
  ];

  // Header formats
  const headerFormats = [
    { code: 'NONE', name: 'None' },
    { code: 'TEXT', name: 'Text' },
    { code: 'IMAGE', name: 'Image' },
    { code: 'VIDEO', name: 'Video' },
    { code: 'DOCUMENT', name: 'Document' }
  ];

  // Button types
  const buttonTypes = [
    { type: 'QUICK_REPLY', label: 'Quick Reply', icon: <FiMessageSquare /> },
    { type: 'PHONE_NUMBER', label: 'Phone Number', icon: <FiPhone /> },
    { type: 'URL', label: 'URL', icon: <FiLink /> },
    { type: 'COPY_CODE', label: 'Copy Code', icon: <FiCopy /> }
  ];

  // Fetch template data for editing
  useEffect(() => {
    const fetchTemplate = async () => {
      if (!tokens?.token || !templateId) return;

      setLoading(true);
      try {
        // First try to get template data from localStorage (from Template.js)
        const templatesData = localStorage.getItem('templatesData');
        let templateFound = false;
        
        if (templatesData) {
          const templates = JSON.parse(templatesData);
          const template = templates.find(t => t.id === templateId);
          
          if (template && template.template_data) {
            console.log('Found template in localStorage:', template);
            populateFormFromTemplate(template);
            templateFound = true;
          }
        }
        
        // If not found in localStorage, try to fetch from API
        if (!templateFound) {
          console.log('Template not found in localStorage, fetching from API...');
          
          try {
            // Use the same API structure as Template.js for consistency
            const { Encrypt } = await import('./encryption/payload-encryption');
            
            const payload = {
              project_id: tokens.projects?.[0]?.project_id || "689d783e207f0b0c309fa07c",
              template_id: templateId
            };

            const { data, key } = Encrypt(payload);
            const data_pass = JSON.stringify({ data, key });

            const response = await axios.post(
              'https://api.w1chat.com/template/template-detail', // Assuming this endpoint exists
              data_pass,
              {
                headers: {
                  'token': tokens.token,
                  'username': tokens.username,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (!response?.data?.error && response?.data?.data) {
              const templateData = response.data.data;
              const template = {
                id: templateData.template_id,
                name: templateData.template_name,
                language: templateData.template?.language || 'en',
                category: templateData.category,
                status: templateData.status,
                template_data: templateData.template
              };
              
              console.log('Fetched template from API:', template);
              populateFormFromTemplate(template);
              templateFound = true;
            }
          } catch (apiError) {
            console.error('API fetch failed:', apiError);
            // Fall back to sample data if API fails
          }
        }
        
        // If still not found, show error and redirect
        if (!templateFound) {
          console.error('Template not found:', templateId);
          alert('Template not found. Redirecting to template list.');
          navigate('/template');
          return;
        }
        
      } catch (error) {
        console.error('Failed to fetch template:', error);
        alert('Failed to load template data');
        navigate('/template');
      } finally {
        setLoading(false);
      }
    };

    if (tokens) {
      fetchTemplate();
    }
  }, [tokens, templateId, navigate]);

  // Populate form from template data
  const populateFormFromTemplate = (template) => {
    console.log('Populating form with template:', template);
    const components = template.template_data?.components || [];
    
    // Initialize form data
    const newFormData = {
      name: template.name || '',
      category: template.category || '',
      language: template.language || 'en',
      components: {
        header: {
          type: 'HEADER',
          format: 'NONE',
          text: '',
          example: { header_handle: [] }
        },
        body: {
          type: 'BODY',
          text: '',
          example: { body_text: [] }
        },
        footer: {
          type: 'FOOTER',
          text: ''
        },
        buttons: {
          type: 'BUTTONS',
          buttons: []
        }
      }
    };

    const newBodyVariables = [];
    let newHeaderVariable = null;

    // Process each component
    components.forEach(component => {
      switch (component.type) {
        case 'HEADER':
          newFormData.components.header = {
            type: 'HEADER',
            format: component.format || 'TEXT',
            text: component.text || '',
            example: component.example || { header_handle: [] }
          };
          
          // Extract header variable if exists
          if (component.text && component.text.includes('{{1}}')) {
            newHeaderVariable = {
              id: Date.now(),
              name: 'var1',
              sample: component.example?.header_text?.[0] || ''
            };
          }
          break;

        case 'BODY':
          newFormData.components.body = {
            type: 'BODY',
            text: component.text || '',
            example: component.example || { body_text: [] }
          };

          // Extract body variables
          if (component.text) {
            const variableMatches = component.text.match(/\{\{(\d+)\}\}/g);
            if (variableMatches) {
              const samples = component.example?.body_text?.[0] || [];
              variableMatches.forEach((match, index) => {
                const varNum = parseInt(match.replace(/[{}]/g, ''));
                newBodyVariables.push({
                  id: Date.now() + index,
                  name: `var${varNum}`,
                  sample: samples[index] || ''
                });
              });
            }
          }
          break;

        case 'FOOTER':
          newFormData.components.footer = {
            type: 'FOOTER',
            text: component.text || ''
          };
          break;

        case 'BUTTONS':
          newFormData.components.buttons = {
            type: 'BUTTONS',
            buttons: component.buttons?.map(btn => {
              if (btn.type === 'otp' && btn.otp_type === 'copy_code') {
                return {
                  type: 'COPY_CODE',
                  text: btn.text,
                  copy_code: ''
                };
              }
              return btn;
            }) || []
          };
          break;

        default:
          break;
      }
    });

    setFormData(newFormData);
    setBodyVariables(newBodyVariables);
    setHeaderVariable(newHeaderVariable);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle header format change
  const handleHeaderFormatChange = (format) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        header: {
          ...prev.components.header,
          format: format,
          text: format === 'TEXT' ? prev.components.header.text : '',
          example: format === 'TEXT' ? { header_text: [] } : { header_handle: [] }
        }
      }
    }));
    if (format !== 'TEXT') {
      setHeaderVariable(null);
    }
  };

  // Handle header media upload
  const handleHeaderMediaUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        // In real implementation, you would upload to your server and get the URL
        // For demo, we'll use a placeholder
        const exampleUrl = `https://example.com/${file.name}`;
        
        setFormData(prev => ({
          ...prev,
          components: {
            ...prev.components,
            header: {
              ...prev.components.header,
              example: {
                header_handle: [exampleUrl]
              }
            }
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle header text change
  const handleHeaderTextChange = (text) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        header: {
          ...prev.components.header,
          text: text
        }
      }
    }));
  };

  // Add a variable to header (only one allowed)
  const addHeaderVariable = () => {
    if (headerVariable) {
      alert('Header can only have one variable');
      return;
    }
    
    const newVariable = {
      id: Date.now(),
      name: 'var1',
      sample: ''
    };
    
    setHeaderVariable(newVariable);
    handleHeaderTextChange(formData.components.header.text + ' {{1}}');
  };

  // Update header variable sample
  const updateHeaderVariable = (sample) => {
    if (headerVariable) {
      setHeaderVariable(prev => ({ ...prev, sample }));
    }
  };

  // Remove header variable
  const removeHeaderVariable = () => {
    if (headerVariable) {
      // Remove variable from header text
      const newHeaderText = formData.components.header.text.replace(/\{\{1\}\}/g, '');
      handleHeaderTextChange(newHeaderText);
      setHeaderVariable(null);
    }
  };

  // Handle body text change
  const handleBodyTextChange = (text) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        body: {
          ...prev.components.body,
          text: text
        }
      }
    }));
  };

  // Add a variable to body at cursor position
  const addBodyVariable = () => {
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const currentText = formData.components.body.text;
    
    const newVariable = {
      id: Date.now(),
      name: `var${bodyVariables.length + 1}`,
      sample: ''
    };
    
    // Insert variable at cursor position
    const variableText = `{{${bodyVariables.length + 1}}}`;
    const newBodyText = currentText.slice(0, startPos) + variableText + currentText.slice(endPos);
    
    setBodyVariables(prev => [...prev, newVariable]);
    handleBodyTextChange(newBodyText);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos + variableText.length, startPos + variableText.length);
    }, 0);
  };

  // Update body variable sample
  const updateBodyVariable = (id, sample) => {
    setBodyVariables(prev => prev.map(v => 
      v.id === id ? { ...v, sample } : v
    ));
  };

  // Remove body variable
  const removeBodyVariable = (id) => {
    const variable = bodyVariables.find(v => v.id === id);
    if (variable) {
      const varIndex = bodyVariables.findIndex(v => v.id === id);
      const varNumber = varIndex + 1;
      
      // Remove variable from body text
      const newBodyText = formData.components.body.text.replace(new RegExp(`\\{\\{${varNumber}\\}\\}`, 'g'), '');
      handleBodyTextChange(newBodyText);
      setBodyVariables(prev => prev.filter(v => v.id !== id));
    }
  };

  // Handle footer text change
  const handleFooterTextChange = (text) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        footer: {
          ...prev.components.footer,
          text: text
        }
      }
    }));
  };

  // Apply formatting to selected text
  const applyFormatting = (format) => {
    const textarea = textareaRef.current;
    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    
    if (startPos === endPos) return;
    
    let formattedText = '';
    const selected = formData.components.body.text.slice(startPos, endPos);
    
    switch(format) {
      case 'bold':
        formattedText = `*${selected}*`;
        break;
      case 'italic':
        formattedText = `_${selected}_`;
        break;
      case 'underline':
        formattedText = `~${selected}~`;
        break;
      case 'code':
        formattedText = '```' + selected + '```';
        break;
      default:
        formattedText = selected;
    }
    
    const newBodyText = formData.components.body.text.slice(0, startPos) + 
                        formattedText + 
                        formData.components.body.text.slice(endPos);
    
    handleBodyTextChange(newBodyText);
    
    // Set cursor position after the formatted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(startPos, startPos + formattedText.length);
    }, 0);
  };

  // Add a button
  const addButton = (type) => {
    if (formData.components.buttons.buttons.length >= 3) {
      alert('Maximum 3 buttons allowed');
      return;
    }

    const newButton = {
      type: type,
      text: '',
      ...(type === 'PHONE_NUMBER' && { phone_number: '' }),
      ...(type === 'URL' && { url: '', example: [] }),
      ...(type === 'COPY_CODE' && { copy_code: '' })
    };

    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        buttons: {
          ...prev.components.buttons,
          buttons: [...prev.components.buttons.buttons, newButton]
        }
      }
    }));
  };

  // Remove a button
  const removeButton = (index) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        buttons: {
          ...prev.components.buttons,
          buttons: prev.components.buttons.buttons.filter((_, i) => i !== index)
        }
      }
    }));
  };

  // Update button data
  const updateButton = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        buttons: {
          ...prev.components.buttons,
          buttons: prev.components.buttons.buttons.map((btn, i) => 
            i === index ? { ...btn, [field]: value } : btn
          )
        }
      }
    }));
  };

  // Add URL example for button
  const addButtonUrlExample = (index) => {
    const currentExamples = formData.components.buttons.buttons[index]?.example || [];
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        buttons: {
          ...prev.components.buttons,
          buttons: prev.components.buttons.buttons.map((btn, i) => 
            i === index ? { 
              ...btn, 
              example: [...currentExamples, ''] 
            } : btn
          )
        }
      }
    }));
  };

  // Update URL example for button
  const updateButtonUrlExample = (buttonIndex, exampleIndex, value) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        buttons: {
          ...prev.components.buttons,
          buttons: prev.components.buttons.buttons.map((btn, i) => 
            i === buttonIndex ? { 
              ...btn, 
              example: btn.example.map((ex, j) => j === exampleIndex ? value : ex)
            } : btn
          )
        }
      }
    }));
  };

  // Remove URL example for button
  const removeButtonUrlExample = (buttonIndex, exampleIndex) => {
    setFormData(prev => ({
      ...prev,
      components: {
        ...prev.components,
        buttons: {
          ...prev.components.buttons,
          buttons: prev.components.buttons.buttons.map((btn, i) => 
            i === buttonIndex ? { 
              ...btn, 
              example: btn.example.filter((_, j) => j !== exampleIndex)
            } : btn
          )
        }
      }
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tokens?.token) {
      alert('Authentication required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare components array
      const components = [];

      // Add header if not NONE
      if (formData.components.header.format !== 'NONE') {
        const headerComponent = {
          type: 'HEADER',
          format: formData.components.header.format
        };

        if (formData.components.header.format === 'TEXT') {
          headerComponent.text = formData.components.header.text;
          if (headerVariable && headerVariable.sample) {
            headerComponent.example = {
              header_text: [headerVariable.sample]
            };
          }
        } else {
          headerComponent.example = formData.components.header.example;
        }

        components.push(headerComponent);
      }

      // Add body
      if (formData.components.body.text) {
        const bodyComponent = {
          type: 'BODY',
          text: formData.components.body.text
        };

        if (bodyVariables.length > 0) {
          const bodySamples = bodyVariables.map(v => v.sample || '');
          bodyComponent.example = {
            body_text: [bodySamples]
          };
        }

        components.push(bodyComponent);
      }

      // Add buttons if any
      if (formData.components.buttons.buttons.length > 0) {
        components.push({
          type: 'BUTTONS',
          buttons: formData.components.buttons.buttons.map(btn => {
            if (btn.type === 'COPY_CODE') {
              // Convert COPY_CODE to OTP format
              return {
                type: 'otp',
                otp_type: 'copy_code',
                text: btn.text
              };
            } else if (btn.type === 'PHONE_NUMBER') {
              return {
                type: btn.type,
                text: btn.text,
                phone_number: btn.phone_number
              };
            } else if (btn.type === 'URL') {
              const buttonData = {
                type: btn.type,
                text: btn.text,
                url: btn.url
              };
              if (btn.example && btn.example.length > 0) {
                buttonData.example = btn.example;
              }
              return buttonData;
            } else {
              return {
                type: btn.type,
                text: btn.text
              };
            }
          })
        });
      }

      // Add footer if exists
      if (formData.components.footer.text) {
        components.push({
          type: 'FOOTER',
          text: formData.components.footer.text
        });
      }

      // Prepare payload for template update using your backend API format
      const templatePayload = {
        category: formData.category,
        components: components
      };

      console.log('Updating template payload:', JSON.stringify(templatePayload, null, 2));

      // Use the correct API endpoint for editing templates
      const response = await axios.post(
        `https://api.w1chat.com/template/edit-template/${templateId}`,
        templatePayload,
        {
          headers: {
            'token': tokens.token,
            'Content-Type': 'application/json'
          }
        }
      );

      // Check for successful response (assuming 200/201 status codes indicate success)
      if (response.status === 200 || response.status === 201) {
        alert('Template updated successfully! Changes have been saved and will be reflected in your template list.');
        // Clear localStorage to force refresh of template list
        localStorage.removeItem('templatesData');
        navigate('/template');
      } else {
        throw new Error(response.data?.message || 'Failed to update template');
      }

    } catch (error) {
      console.error('Error updating template:', error);
      alert(`Failed to update template: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate preview text with variables replaced
  const generatePreviewText = (text, variables) => {
    let preview = text;
    variables.forEach((v, i) => {
      const varNumber = i + 1;
      preview = preview.replace(new RegExp(`\\{\\{${varNumber}\\}\\}`, 'g'), v.sample || `{{${varNumber}}}`);
    });
    return preview;
  };

  // Format text for WhatsApp preview
  const formatTextForPreview = (text) => {
    if (!text) return '';
    
    return text
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/~(.*?)~/g, '<s>$1</s>')
      .replace(/```(.*?)```/gs, '<code>$1</code>');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        <div className="pt-16 md:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-lg text-gray-600">Loading template...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      {/* Main content */}
      <div className="pt-16 md:pl-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <button
                onClick={() => navigate('/template')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
              >
                <FiArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Edit WhatsApp Template</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Edit your WhatsApp message template - Template ID: {templateId}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form section */}
            <div className="bg-white shadow rounded-lg p-6">
              <form onSubmit={handleSubmit}>
                {/* Template Name - Read Only */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    disabled
                    placeholder="Template name (read-only)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Template name cannot be changed after creation
                  </p>
                </div>

                {/* Category */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(cat => (
                        <option key={cat.code} value={cat.code}>{cat.name}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-3 text-gray-400" />
                  </div>
                </div>

                {/* Language - Read Only */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <input
                    type="text"
                    value={languages.find(lang => lang.code === formData.language)?.name || formData.language}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                    disabled
                    placeholder="Language (read-only)"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Language cannot be changed after creation
                  </p>
                </div>

                {/* Header Format */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Header Format
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {headerFormats.map(format => (
                      <button
                        key={format.code}
                        type="button"
                        onClick={() => handleHeaderFormatChange(format.code)}
                        className={`p-2 border rounded-md text-sm text-center ${
                          formData.components.header.format === format.code
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {format.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Header Content based on format */}
                {formData.components.header.format !== 'NONE' && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Header Content ({formData.components.header.format})
                    </label>
                    
                    {formData.components.header.format === 'TEXT' && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Header Text</span>
                          {!headerVariable && (
                            <button
                              type="button"
                              onClick={addHeaderVariable}
                              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                            >
                              + Add Variable
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={2}
                          value={formData.components.header.text}
                          onChange={(e) => handleHeaderTextChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter header text"
                          maxLength={60}
                        />
                        <p className="text-xs text-gray-500">
                          {formData.components.header.text.length}/60 characters
                        </p>
                        
                        {/* Header Variable - Only One Allowed */}
                        {headerVariable && (
                          <div className="p-3 bg-white border rounded-md">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Variable: {headerVariable.name}
                              </span>
                              <button
                                type="button"
                                onClick={removeHeaderVariable}
                                className="text-red-500 hover:text-red-700"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="Enter sample value"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={headerVariable.sample}
                              onChange={e => updateHeaderVariable(e.target.value)}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Header can only have one variable. This will be sent as: ["sample_value"]
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(formData.components.header.format === 'IMAGE' || formData.components.header.format === 'VIDEO' || formData.components.header.format === 'DOCUMENT') && (
                      <div>
                        {formData.components.header.example.header_handle && formData.components.header.example.header_handle.length > 0 ? (
                          <div className="flex items-center justify-between p-2 bg-white border rounded-md">
                            <div className="flex items-center">
                              <FiPaperclip className="text-gray-500 mr-2" />
                              <span className="text-sm truncate">
                                {formData.components.header.example.header_handle[0].split('/').pop()}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleHeaderFormatChange('NONE')}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <FiX />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <FiPaperclip className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">Click to upload {formData.components.header.format.toLowerCase()}</p>
                              <p className="text-xs text-gray-400">MAX. 5MB</p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleHeaderMediaUpload}
                              accept={
                                formData.components.header.format === 'IMAGE' ? 'image/*' : 
                                formData.components.header.format === 'VIDEO' ? 'video/*' : 
                                '*'
                              }
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Body Content */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Body Content *
                    </label>
                    <button
                      type="button"
                      onClick={addBodyVariable}
                      className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                    >
                      + Add Variable
                    </button>
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your message content here. Use {1} for variables."
                    value={formData.components.body.text}
                    onChange={(e) => handleBodyTextChange(e.target.value)}
                    required
                  ></textarea>
                  
                  {/* Text formatting toolbar */}
                  <div className="mt-2 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => applyFormatting('bold')}
                      className="p-1.5 rounded border border-gray-300 hover:bg-gray-100"
                      title="Bold"
                    >
                      <FiBold size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('italic')}
                      className="p-1.5 rounded border border-gray-300 hover:bg-gray-100"
                      title="Italic"
                    >
                      <FiItalic size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('underline')}
                      className="p-1.5 rounded border border-gray-300 hover:bg-gray-100"
                      title="Strikethrough"
                    >
                      <FiUnderline size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('code')}
                      className="p-1.5 rounded border border-gray-300 hover:bg-gray-100"
                      title="Monospace"
                    >
                      <FiCode size={16} />
                    </button>
                  </div>
                  
                  <p className="mt-1 text-xs text-gray-500">
                    Use variables like {`{{1}}`} to personalize your message. Select text and use formatting buttons.
                  </p>
                  
                  {/* Body Variables */}
                  {bodyVariables.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {bodyVariables.map(variable => (
                        <div key={variable.id} className="p-3 bg-gray-50 border rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Variable: {variable.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeBodyVariable(variable.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Enter sample value"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={variable.sample}
                            onChange={e => updateBodyVariable(variable.id, e.target.value)}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Each variable sample will be wrapped in individual arrays: [["value1"], ["value2"]]
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={formData.components.footer.text}
                    onChange={(e) => handleFooterTextChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Optional footer text"
                    maxLength={60}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.components.footer.text.length}/60 characters
                  </p>
                </div>

                {/* Buttons */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Buttons
                    </label>
                    <span className="text-sm text-gray-500">
                      {formData.components.buttons.buttons.length}/3 added
                    </span>
                  </div>
                  
                  {/* Button selection */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {buttonTypes.map(btn => (
                      <button
                        key={btn.type}
                        type="button"
                        onClick={() => addButton(btn.type)}
                        disabled={formData.components.buttons.buttons.length >= 3}
                        className="flex items-center justify-center p-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="mr-1">{btn.icon}</span>
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  
                  {/* Added buttons */}
                  <div className="space-y-3">
                    {formData.components.buttons.buttons.map((btn, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {buttonTypes.find(b => b.type === btn.type)?.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeButton(index)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <FiX size={16} />
                          </button>
                        </div>
                        
                        {/* Button Text */}
                        <input
                          type="text"
                          placeholder="Button text"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
                          value={btn.text}
                          onChange={e => updateButton(index, 'text', e.target.value)}
                        />
                        
                        {/* Phone Number Button */}
                        {btn.type === 'PHONE_NUMBER' && (
                          <input
                            type="tel"
                            placeholder="Phone number (e.g., 917089379345)"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            value={btn.phone_number}
                            onChange={e => updateButton(index, 'phone_number', e.target.value)}
                          />
                        )}
                        
                        {/* URL Button */}
                        {btn.type === 'URL' && (
                          <div className="space-y-2">
                            <input
                              type="url"
                              placeholder="URL (e.g., https://example.com/{1})"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={btn.url}
                              onChange={e => updateButton(index, 'url', e.target.value)}
                            />
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">URL Examples:</span>
                              <button
                                type="button"
                                onClick={() => addButtonUrlExample(index)}
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                              >
                                + Add Example
                              </button>
                            </div>
                            {btn.example?.map((example, exIndex) => (
                              <div key={exIndex} className="flex gap-2">
                                <input
                                  type="url"
                                  placeholder="Example URL"
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  value={example}
                                  onChange={e => updateButtonUrlExample(index, exIndex, e.target.value)}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeButtonUrlExample(index, exIndex)}
                                  className="px-2 text-red-500 hover:text-red-700"
                                >
                                  <FiX size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Copy Code Button */}
                        {btn.type === 'COPY_CODE' && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-600 mb-1">
                              This button will be converted to OTP format with type "otp" and otp_type "copy_code"
                            </p>
                            <input
                              type="text"
                              placeholder="Code to copy"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              value={btn.copy_code}
                              onChange={e => updateButton(index, 'copy_code', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <div className="mt-8 flex space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate('/template')}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FiSave className="mr-2" />
                        Update Template
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">WhatsApp Preview</h3>
              
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="bg-white rounded-lg shadow-md max-w-xs mx-auto overflow-hidden">
                  {/* Header */}
                  {formData.components.header.format !== 'NONE' && (
                    <div className="border-b border-gray-200">
                      {formData.components.header.format === 'TEXT' && formData.components.header.text && (
                        <div className="p-3 bg-indigo-50">
                          <p className="text-sm font-medium text-indigo-800">
                            {headerVariable 
                              ? generatePreviewText(formData.components.header.text, [headerVariable])
                              : formData.components.header.text
                            }
                          </p>
                        </div>
                      )}
                      
                      {formData.components.header.example.header_handle && 
                       formData.components.header.example.header_handle.length > 0 && 
                       formData.components.header.format !== 'TEXT' && (
                        <div className="h-48 bg-gray-200 overflow-hidden relative">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FiPaperclip className="text-3xl text-gray-600" />
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {formData.components.header.format}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Body */}
                  <div className="p-4">
                    <div 
                      className="text-sm text-gray-800 whitespace-pre-wrap break-words"
                      dangerouslySetInnerHTML={{ 
                        __html: bodyVariables.length > 0 
                          ? formatTextForPreview(generatePreviewText(formData.components.body.text, bodyVariables)) 
                          : formatTextForPreview(formData.components.body.text) || "This is a preview of your template message. The actual content will appear here."
                      }}
                    ></div>
                    
                    {/* Buttons preview */}
                    {formData.components.buttons.buttons.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {formData.components.buttons.buttons.map((btn, index) => (
                          <div key={index} className="text-center">
                            <div className="inline-block px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium border border-gray-200">
                              {btn.text || (buttonTypes.find(b => b.type === btn.type)?.label)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Footer */}
                  {formData.components.footer.text && (
                    <div className="p-3 bg-gray-50 border-t border-gray-200">
                      <p className="text-xs text-gray-500">{formData.components.footer.text}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium">Edit Guidelines:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Template name and language cannot be changed</li>
                  <li>Only category and components can be modified</li>
                  <li>Changes require re-approval from WhatsApp</li>
                  <li>Use *text* for bold, _text_ for italics, and ~text~ for strikethrough</li>
                </ul>
              </div>

              {/* JSON Preview */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-2">JSON Payload Preview</h4>
                <pre className="bg-gray-800 text-green-400 p-4 rounded-md text-xs overflow-auto max-h-64">
                  {JSON.stringify({
                    category: formData.category || 'CATEGORY',
                    components: (() => {
                      const comps = [];
                      
                      // Header component
                      if (formData.components.header.format !== 'NONE') {
                        const headerComp = {
                          type: 'HEADER',
                          format: formData.components.header.format
                        };
                        
                        if (formData.components.header.format === 'TEXT') {
                          headerComp.text = formData.components.header.text;
                          if (headerVariable && headerVariable.sample) {
                            headerComp.example = {
                              header_text: [headerVariable.sample]
                            };
                          }
                        } else {
                          headerComp.example = formData.components.header.example;
                        }
                        comps.push(headerComp);
                      }
                      
                      // Body component
                      if (formData.components.body.text) {
                        const bodyComp = {
                          type: 'BODY',
                          text: formData.components.body.text
                        };
                        
                        if (bodyVariables.length > 0) {
                          const bodySamples = bodyVariables.map(v => v.sample || '');
                          bodyComp.example = {
                            body_text: [bodySamples]
                          };
                        }
                        comps.push(bodyComp);
                      }
                      
                      // Buttons component
                      if (formData.components.buttons.buttons.length > 0) {
                        comps.push({
                          type: 'BUTTONS',
                          buttons: formData.components.buttons.buttons.map(btn => {
                            if (btn.type === 'COPY_CODE') {
                              return {
                                type: 'otp',
                                otp_type: 'copy_code',
                                text: btn.text
                              };
                            } else if (btn.type === 'PHONE_NUMBER') {
                              return {
                                type: btn.type,
                                text: btn.text,
                                phone_number: btn.phone_number
                              };
                            } else if (btn.type === 'URL') {
                              const buttonData = {
                                type: btn.type,
                                text: btn.text,
                                url: btn.url
                              };
                              if (btn.example && btn.example.length > 0) {
                                buttonData.example = btn.example;
                              }
                              return buttonData;
                            } else {
                              return {
                                type: btn.type,
                                text: btn.text
                              };
                            }
                          })
                        });
                      }
                      
                      // Footer component
                      if (formData.components.footer.text) {
                        comps.push({
                          type: 'FOOTER',
                          text: formData.components.footer.text
                        });
                      }
                      
                      return comps;
                    })()
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplateEdit;
