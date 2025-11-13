import React from 'react';
import axios from 'axios';
import { Encrypt } from '../../encryption/payload-encryption';
import { Send, ChevronRight } from 'lucide-react';
import { canProceed, getAudienceSummary } from '../utils/campaignHelpers';

export default function CampaignSummary({
  activeTab,
  setActiveTab,
  audienceType,
  selectedContacts,
  selectedGroups,
  excelMapping,
  sheetLink,
  selectedTemplate,
  variableValues,
  variableSources = {},
  campaignName,
  setCampaignName,
  excelHeaders = [],
  excelData = [],
  excelFileUrl = '',
  selectedContactDetails = [],
  tokens
}) {
  const handleProceed = () => {
    if (activeTab === 'audience') {
      setActiveTab('template');
    }
  };

  const campaignCreateUrl = 'https://api.w1chat.com/campaign/create';

  const handleLaunchCampaign = async () => {
    if (!tokens?.token || !tokens?.username) {
      alert('You must be signed in to launch a campaign.');
      return;
    }
    if (!selectedTemplate?.id) {
      alert('Please select a template.');
      return;
    }
    if (!campaignName || campaignName.trim() === '') {
      alert('Please enter a campaign name.');
      return;
    }

    // Handle Contact campaigns
    if (audienceType === 'contacts') {
      try {
        if (!selectedContacts || selectedContacts.length === 0) {
          alert('Please select at least one contact.');
          return;
        }

        if (!selectedContactDetails || selectedContactDetails.length === 0) {
          alert('Contact details are missing. Please reselect your contacts.');
          return;
        }

        // Extract phone numbers from selected contacts
        const phoneNumbers = selectedContactDetails
          .map(contact => contact?.number || contact?.phone)
          .filter(phone => phone && phone.trim() !== '');

        if (phoneNumbers.length === 0) {
          alert('No valid phone numbers found in selected contacts.');
          return;
        }

        // Build WhatsApp component parameters based on template variables
        // Map template variables to contact variables ({{name}}, {{number}}, etc.)
        const formattedComponents = [];
        const templateComponents = selectedTemplate?.template_data?.components || [];
        
        // Helper function to map variable source to contact variable name
        const getContactVariableName = (varName, source) => {
          if (source?.type === 'contact') {
            // Map contact field keys to variable names
            const keyMap = {
              'contact.name': 'name',
              'contact.number': 'number',
              'contact.firm_name': 'firm_name',
              'contact.website': 'website',
              'contact.email': 'email',
              'contact.current_date': 'current_date',
              'contact.current_time': 'current_time',
              'contact.current_day': 'current_day'
            };
            return keyMap[source.key] || null;
          }
          
          // Check if it's a manual value that matches a contact variable pattern
          const manualValue = variableValues[varName] || '';
          if (manualValue.trim() === '') return null;
          
          // Check for dynamic variables (current_date, current_time, current_day)
          const lowerValue = manualValue.toLowerCase();
          if (lowerValue.includes('current_date') || lowerValue.includes('date')) {
            return 'current_date';
          }
          if (lowerValue.includes('current_time') || lowerValue.includes('time')) {
            return 'current_time';
          }
          if (lowerValue.includes('current_day') || lowerValue.includes('day')) {
            return 'current_day';
          }
          
          return null;
        };
        
        // Process BODY component
        const bodyComponent = templateComponents.find((c) => c.type === 'BODY' && c.text);
        if (bodyComponent?.text) {
          const variableMatches = bodyComponent.text.match(/\{\{\d+\}\}/g) || [];
          const parameters = [];
          
          if (variableMatches.length > 0) {
            variableMatches.forEach((match) => {
              const varNum = match.match(/\d+/)?.[0];
              const varName = `var_${varNum}`;
              const source = variableSources[varName];
              
              // Try to get contact variable name
              const contactVarName = getContactVariableName(varName, source);
              
              if (contactVarName) {
                // Use contact variable format: {{name}}, {{number}}, etc.
                parameters.push({
                  type: 'text',
                  text: `{{${contactVarName}}}`
                });
              } else {
                // Fallback: use manual value if provided
                const manualValue = variableValues[varName] || '';
                parameters.push({
                  type: 'text',
                  text: manualValue
                });
              }
            });
          }
          
          if (parameters.length > 0) {
            formattedComponents.push({
              type: 'body',
              parameters
            });
          }
        }
        
        // Process HEADER component if it has variables
        const headerComponent = templateComponents.find((c) => c.type === 'HEADER' && c.format === 'TEXT' && c.text);
        if (headerComponent?.text) {
          const variableMatches = headerComponent.text.match(/\{\{\d+\}\}/g) || [];
          const parameters = [];
          
          if (variableMatches.length > 0) {
            variableMatches.forEach((match) => {
              const varNum = match.match(/\d+/)?.[0];
              const varName = `var_${varNum}`;
              const source = variableSources[varName];
              
              const contactVarName = getContactVariableName(varName, source);
              
              if (contactVarName) {
                parameters.push({
                  type: 'text',
                  text: `{{${contactVarName}}}`
                });
              } else {
                const manualValue = variableValues[varName] || '';
                parameters.push({
                  type: 'text',
                  text: manualValue
                });
              }
            });
          }
          
          if (parameters.length > 0) {
            formattedComponents.push({
              type: 'header',
              parameters
            });
          }
        }

        const payload = {
          phone: phoneNumbers,
          name: campaignName,
          template_id: selectedTemplate.id,
          project_id: tokens?.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
          component: formattedComponents
        };

        console.log('Contact Campaign Payload:', payload);

        const { data, key } = Encrypt(payload);
        const data_pass = JSON.stringify({ data, key });

        const endpoint = `${campaignCreateUrl}/contact`;

        const response = await axios.post(
          endpoint,
          data_pass,
          {
            headers: {
              token: tokens.token,
              username: tokens.username,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response?.data?.error) {
          throw new Error(response?.data?.message || 'Failed to create contact campaign');
        }

        alert('Contact campaign created successfully.');
        // Optionally navigate or reset UI here
      } catch (err) {
        console.error('Failed to create contact campaign:', err);
        alert(err?.message || 'Failed to create contact campaign');
      }
      return;
    }

    // Handle Group campaigns
    if (audienceType === 'groups') {
      try {
        if (!selectedGroups || selectedGroups.length === 0) {
          alert('Please select at least one group.');
          return;
        }

        // Use the first selected group (API expects a single group_id)
        const groupId = selectedGroups[0];

        // Build WhatsApp component parameters based on template variables
        // Map template variables to contact variables ({{name}}, {{number}}, etc.)
        // Groups use the same contact variables as individual contacts
        const formattedComponents = [];
        const templateComponents = selectedTemplate?.template_data?.components || [];
        
        // Helper function to map variable source to contact variable name
        // Same as contact campaigns since groups contain contacts
        const getContactVariableName = (varName, source) => {
          if (source?.type === 'contact') {
            // Map contact field keys to variable names
            const keyMap = {
              'contact.name': 'name',
              'contact.number': 'number',
              'contact.firm_name': 'firm_name',
              'contact.website': 'website',
              'contact.email': 'email',
              'contact.current_date': 'current_date',
              'contact.current_time': 'current_time',
              'contact.current_day': 'current_day'
            };
            return keyMap[source.key] || null;
          }
          
          // Check if it's a manual value that matches a contact variable pattern
          const manualValue = variableValues[varName] || '';
          if (manualValue.trim() === '') return null;
          
          // Check for dynamic variables (current_date, current_time, current_day)
          const lowerValue = manualValue.toLowerCase();
          if (lowerValue.includes('current_date') || lowerValue.includes('date')) {
            return 'current_date';
          }
          if (lowerValue.includes('current_time') || lowerValue.includes('time')) {
            return 'current_time';
          }
          if (lowerValue.includes('current_day') || lowerValue.includes('day')) {
            return 'current_day';
          }
          
          return null;
        };
        
        // Process BODY component
        const bodyComponent = templateComponents.find((c) => c.type === 'BODY' && c.text);
        if (bodyComponent?.text) {
          const variableMatches = bodyComponent.text.match(/\{\{\d+\}\}/g) || [];
          const parameters = [];
          
          if (variableMatches.length > 0) {
            variableMatches.forEach((match) => {
              const varNum = match.match(/\d+/)?.[0];
              const varName = `var_${varNum}`;
              const source = variableSources[varName];
              
              // Try to get contact variable name
              const contactVarName = getContactVariableName(varName, source);
              
              if (contactVarName) {
                // Use contact variable format: {{name}}, {{number}}, etc.
                parameters.push({
                  type: 'text',
                  text: `{{${contactVarName}}}`
                });
              } else {
                // Fallback: use manual value if provided
                const manualValue = variableValues[varName] || '';
                parameters.push({
                  type: 'text',
                  text: manualValue
                });
              }
            });
          }
          
          if (parameters.length > 0) {
            formattedComponents.push({
              type: 'body',
              parameters
            });
          }
        }
        
        // Process HEADER component if it has variables
        const headerComponent = templateComponents.find((c) => c.type === 'HEADER' && c.format === 'TEXT' && c.text);
        if (headerComponent?.text) {
          const variableMatches = headerComponent.text.match(/\{\{\d+\}\}/g) || [];
          const parameters = [];
          
          if (variableMatches.length > 0) {
            variableMatches.forEach((match) => {
              const varNum = match.match(/\d+/)?.[0];
              const varName = `var_${varNum}`;
              const source = variableSources[varName];
              
              const contactVarName = getContactVariableName(varName, source);
              
              if (contactVarName) {
                parameters.push({
                  type: 'text',
                  text: `{{${contactVarName}}}`
                });
              } else {
                const manualValue = variableValues[varName] || '';
                parameters.push({
                  type: 'text',
                  text: manualValue
                });
              }
            });
          }
          
          if (parameters.length > 0) {
            formattedComponents.push({
              type: 'header',
              parameters
            });
          }
        }

        const payload = {
          group_id: groupId,
          name: campaignName,
          template_id: selectedTemplate.id,
          project_id: tokens?.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
          component: formattedComponents
        };

        console.log('Group Campaign Payload:', payload);

        const { data, key } = Encrypt(payload);
        const data_pass = JSON.stringify({ data, key });

        const endpoint = `${campaignCreateUrl}/group`;

        const response = await axios.post(
          endpoint,
          data_pass,
          {
            headers: {
              token: tokens.token,
              username: tokens.username,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response?.data?.error) {
          throw new Error(response?.data?.message || 'Failed to create group campaign');
        }

        alert('Group campaign created successfully.');
        // Optionally navigate or reset UI here
      } catch (err) {
        console.error('Failed to create group campaign:', err);
        alert(err?.message || 'Failed to create group campaign');
      }
      return;
    }

    // Handle Excel and Google Sheet campaigns (same logic, different endpoints)
    if (audienceType === 'excel' || audienceType === 'sheet') {
      try {
        // Derive phone column index (1-based) from selected mapping
        const phoneIndex =
          excelMapping?.phone && Array.isArray(excelHeaders)
            ? excelHeaders.indexOf(excelMapping.phone) + 1
            : 0;

        if (!phoneIndex || phoneIndex < 1) {
          const sourceType = audienceType === 'excel' ? 'Excel' : 'Google Sheet';
          alert(`Please map the phone number column in your ${sourceType}.`);
          return;
        }

        // Determine URL and validate based on audience type
        let fileUrl;
        if (audienceType === 'excel') {
          fileUrl = excelFileUrl || sheetLink;
          if (!fileUrl || !fileUrl.startsWith('http')) {
            alert('Please upload an Excel file first. The file needs to be uploaded to the server before creating a campaign.');
            return;
          }
        } else {
          // Google Sheet
          if (!sheetLink || !sheetLink.trim()) {
            alert('Please provide a Google Sheet link.');
            return;
          }
          fileUrl = sheetLink.trim();
        }

        // Compute start/end rows (headers are row 1)
        const startRow = 2;
        const endRow = Math.max(1 + (Array.isArray(excelData) ? excelData.length : 0), 2);

        // Build WhatsApp component parameters based on template BODY placeholders
        // Map template variables ({{1}}, {{2}}, etc.) to Excel column indices ({{0}}, {{1}}, etc.)
        const formattedComponents = [];
        const templateComponents = selectedTemplate?.template_data?.components || [];
        
        // Process BODY component
        const bodyComponent = templateComponents.find((c) => c.type === 'BODY' && c.text);
        if (bodyComponent?.text) {
          // Extract all variables from template text in order (e.g., {{1}}, {{2}})
          const variableMatches = bodyComponent.text.match(/\{\{\d+\}\}/g) || [];
          const parameters = [];
          
          if (variableMatches.length > 0) {
            variableMatches.forEach((match) => {
              // Extract the variable number from template (e.g., "1" from "{{1}}")
              const varNum = match.match(/\d+/)?.[0];
              const varName = `var_${varNum}`;
              
              // Find which Excel column is mapped to this template variable
              const source = variableSources[varName];
              if (source?.type === 'excel' && source?.key) {
                // Find the Excel column index (0-based)
                const excelColumnIndex = excelHeaders.indexOf(source.key);
                if (excelColumnIndex >= 0) {
                  // Use Excel column index in the parameter (e.g., {{0}}, {{1}})
                  parameters.push({
                    type: 'text',
                    text: `{{${excelColumnIndex}}}`
                  });
                } else {
                  // Fallback: if column not found, use empty string
                  parameters.push({
                    type: 'text',
                    text: ''
                  });
                }
              } else {
                // If not mapped to Excel column, use the manually typed value from variableValues
                const manualValue = variableValues[varName] || '';
                parameters.push({
                  type: 'text',
                  text: manualValue
                });
              }
            });
          }
          
          if (parameters.length > 0) {
            formattedComponents.push({
              type: 'body',
              parameters
            });
          }
        }
        
        // Process HEADER component if it has variables
        const headerComponent = templateComponents.find((c) => c.type === 'HEADER' && c.format === 'TEXT' && c.text);
        if (headerComponent?.text) {
          const variableMatches = headerComponent.text.match(/\{\{\d+\}\}/g) || [];
          const parameters = [];
          
          if (variableMatches.length > 0) {
            variableMatches.forEach((match) => {
              const varNum = match.match(/\d+/)?.[0];
              const varName = `var_${varNum}`;
              const source = variableSources[varName];
              
              if (source?.type === 'excel' && source?.key) {
                const excelColumnIndex = excelHeaders.indexOf(source.key);
                if (excelColumnIndex >= 0) {
                  parameters.push({
                    type: 'text',
                    text: `{{${excelColumnIndex}}}`
                  });
                } else {
                  parameters.push({
                    type: 'text',
                    text: ''
                  });
                }
              } else {
                // If not mapped to Excel column, use the manually typed value from variableValues
                const manualValue = variableValues[varName] || '';
                parameters.push({
                  type: 'text',
                  text: manualValue
                });
              }
            });
          }
          
          if (parameters.length > 0) {
            formattedComponents.push({
              type: 'header',
              parameters
            });
          }
        }

        const payload = {
          url: fileUrl,
          phone_index: phoneIndex,
          start_row: startRow,
          end_row: endRow,
          name: campaignName,
          template_id: selectedTemplate.id,
          project_id: tokens?.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
          component: formattedComponents
        };

        console.log(`${audienceType === 'excel' ? 'Excel' : 'Google Sheet'} Campaign Payload:`, payload);

        const { data, key } = Encrypt(payload);
        const data_pass = JSON.stringify({ data, key });

        // Determine endpoint based on audience type
        const endpoint = `${campaignCreateUrl}/${audienceType === 'excel' ? 'excel' : 'sheet'}`;
        const sourceType = audienceType === 'excel' ? 'Excel' : 'Google Sheet';

        const response = await axios.post(
          endpoint,
          data_pass,
          {
            headers: {
              token: tokens.token,
              username: tokens.username,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response?.data?.error) {
          throw new Error(response?.data?.message || `Failed to create ${sourceType} campaign`);
        }

        alert(`${sourceType} campaign created successfully.`);
        // Optionally navigate or reset UI here
      } catch (err) {
        const sourceType = audienceType === 'excel' ? 'Excel' : 'Google Sheet';
        console.error(`Failed to create ${sourceType} campaign:`, err);
        alert(err?.message || `Failed to create ${sourceType} campaign`);
      }
      return;
    }

    // Fallback for other audience types (not implemented yet)
    console.log('Launching campaign (non-excel)...', {
      audienceType,
      selectedContacts,
      selectedGroups,
      selectedTemplate,
      campaignName
    });
  };

  const proceedEnabled = canProceed(
    activeTab,
    audienceType,
    selectedContacts,
    selectedGroups,
    excelMapping,
    sheetLink,
    selectedTemplate,
    variableValues
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
      <h3 className="font-semibold text-gray-800 mb-4">Campaign Summary</h3>
      
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-500">Audience</div>
          <div className="font-medium text-gray-800">
            {getAudienceSummary(audienceType, selectedContacts, selectedGroups, excelMapping, sheetLink)}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Template</div>
          <div className="font-medium text-gray-800">
            {selectedTemplate ? selectedTemplate.name : 'Not selected'}
          </div>
        </div>

        {activeTab === 'template' && (
          <div>
            <label className="block text-sm text-gray-500 mb-1">Campaign Name</label>
            <input
              type="text"
              value={campaignName || ''}
              onChange={(e) => setCampaignName?.(e.target.value)}
              placeholder="Enter a campaign name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        )}

        <div className="border-t pt-4">
          {activeTab === 'audience' && (
            <button
              onClick={handleProceed}
              disabled={!proceedEnabled}
              className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                proceedEnabled
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
                onClick={handleLaunchCampaign}
                disabled={!proceedEnabled || !campaignName || campaignName.trim() === ''}
                className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  proceedEnabled && campaignName && campaignName.trim() !== ''
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
  );
}

