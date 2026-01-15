import React, { useState } from 'react';
import axios from 'axios';
import { Encrypt } from '../../encryption/payload-encryption';
import { Send, ChevronRight, Calendar, Clock } from 'lucide-react';
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
  scheduleDate,
  setScheduleDate,
  excelHeaders = [],
  excelData = [],
  excelFileUrl = '',
  selectedContactDetails = [],
  tokens
}) {
  const [isScheduled, setIsScheduled] = useState(false);
  
  const handleProceed = () => {
    if (activeTab === 'audience') {
      setActiveTab('template');
    }
  };

  // Helper function to format datetime for backend (YYYY-MM-DD HH:mm:ss)
  const formatScheduleDate = (dateTimeLocal) => {
    if (!dateTimeLocal) return null;
    // dateTimeLocal is in format: "2026-01-15T18:30"
    // Convert to: "2026-01-15 18:30:00"
    const [date, time] = dateTimeLocal.split('T');
    return `${date} ${time}:00`;
  };

  // Helper function to get minimum datetime (current time + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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
        
        // Process HEADER component - only if it has variables
        const headerComponent = templateComponents.find((c) => c.type === 'HEADER' && c.format === 'TEXT' && c.text);
        if (headerComponent?.text) {
          const variableMatches = headerComponent.text.match(/\{\{\d+\}\}/g) || [];
          
          if (variableMatches.length > 0) {
            const parameters = [];
            
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
            
            formattedComponents.push({
              type: 'header',
              parameters
            });
          }
        }
        
        // Process BODY component - always include with parameters array
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
          
          // Always include body component with parameters array (empty or populated)
          formattedComponents.push({
            type: 'body',
            parameters
          });
        }

        const payload = {
          phone: phoneNumbers,
          name: campaignName,
          template_id: selectedTemplate.id,
          project_id: tokens?.selected_project_id || tokens?.projects?.[0]?.project_id || '',
          component: formattedComponents
        };

        // Add schedule_date if scheduled
        if (isScheduled && scheduleDate) {
          payload.schedule_date = formatScheduleDate(scheduleDate);
        }

        console.log('Contact Campaign Payload (before encryption):', payload);

        // TEMPORARY: Send unencrypted data for testing (backend has Decrypt commented out)
        // TODO: Remove this and uncomment the encrypted version once backend Decrypt is fixed
        const data_pass = JSON.stringify(payload);

        // ORIGINAL ENCRYPTED VERSION (commented out temporarily):
        // const { data, key } = Encrypt(payload);
        // const data_pass = JSON.stringify({ data, key });

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

        // Backend expects group_ids as an array
        const groupIds = selectedGroups; // Send all selected groups as array

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
        
        // Process HEADER component - only if it has variables
        const headerComponent = templateComponents.find((c) => c.type === 'HEADER' && c.format === 'TEXT' && c.text);
        if (headerComponent?.text) {
          const variableMatches = headerComponent.text.match(/\{\{\d+\}\}/g) || [];
          
          if (variableMatches.length > 0) {
            const parameters = [];
            
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
            
            formattedComponents.push({
              type: 'header',
              parameters
            });
          }
        }
        
        // Process BODY component - always include with parameters array
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
          
          // Always include body component with parameters array (empty or populated)
          formattedComponents.push({
            type: 'body',
            parameters
          });
        }

        const payload = {
          group_ids: groupIds, // Changed from group_id to group_ids (array)
          name: campaignName,
          template_id: selectedTemplate.id,
          project_id: tokens?.selected_project_id || tokens?.projects?.[0]?.project_id || '',
          component: formattedComponents
        };

        // Add schedule_date if scheduled
        if (isScheduled && scheduleDate) {
          payload.schedule_date = formatScheduleDate(scheduleDate);
        }

        console.log('Group Campaign Payload (before encryption):', payload);

        // TEMPORARY: Send unencrypted data for testing (backend has Decrypt commented out)
        // TODO: Remove this and uncomment the encrypted version once backend Decrypt is fixed
        const data_pass = JSON.stringify(payload);

        // ORIGINAL ENCRYPTED VERSION (commented out temporarily):
        // const { data, key } = Encrypt(payload);
        // const data_pass = JSON.stringify({ data, key });

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
            ? excelHeaders.indexOf(excelMapping.phone)
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

        // Compute start/end rows (1-based indexing)
        // startRow = 1 (first data row after header)
        // endRow = last data row index (1-based)
        // Example: 4 data rows means rows 1, 2, 3, 4 -> endRow = 4
        const startRow = 1;
        const endRow = Array.isArray(excelData) && excelData.length > 0 ? excelData.length : 1;

        // Build WhatsApp component parameters based on template components
        // For Excel/Sheet campaigns, only include components that have variables/parameters
        // BUTTONS and FOOTER are part of the template and should NOT be sent in the component array
        const formattedComponents = [];
        const templateComponents = selectedTemplate?.template_data?.components || [];
        
        // Process HEADER component (TEXT format) - only if it has variables
        const headerComponent = templateComponents.find((c) => c.type === 'HEADER' && c.format === 'TEXT' && c.text);
        if (headerComponent?.text) {
          const variableMatches = headerComponent.text.match(/\{\{\d+\}\}/g) || [];
          
          // Only include HEADER if it has variables
          if (variableMatches.length > 0) {
            const parameters = [];
            
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
                const manualValue = variableValues[varName] || '';
                parameters.push({
                  type: 'text',
                  text: manualValue
                });
              }
            });
            
            formattedComponents.push({
              type: 'HEADER',
              parameters: parameters
            });
          }
        }
        
        // Process BODY component - always include (with empty or populated parameters array)
        const bodyComponent = templateComponents.find((c) => c.type === 'BODY' && c.text);
        if (bodyComponent?.text) {
          const variableMatches = bodyComponent.text.match(/\{\{\d+\}\}/g) || [];
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
                const manualValue = variableValues[varName] || '';
                parameters.push({
                  type: 'text',
                  text: manualValue
                });
              }
            });
          }
          
          // Always include BODY component with parameters array (empty or populated)
          formattedComponents.push({
            type: 'BODY',
            parameters: parameters
          });
        }
        
        // DO NOT include FOOTER - it's part of the template definition
        // DO NOT include BUTTONS - they're part of the template definition
        // DO NOT include media HEADER without variables - it's part of the template definition

        const payload = {
          url: fileUrl,
          phone_index: phoneIndex.toString(),
          start_row: startRow.toString(),
          end_row: endRow.toString(),
          component: formattedComponents,
          name: campaignName,
          template_id: selectedTemplate.id,
          project_id: tokens?.selected_project_id || tokens?.projects?.[0]?.project_id || '',
          source: 'excel'
        };

        // Add schedule_date if scheduled
        if (isScheduled && scheduleDate) {
          payload.schedule_date = formatScheduleDate(scheduleDate);
        }

        console.log(`${audienceType === 'excel' ? 'Excel' : 'Google Sheet'} Campaign Payload (before encryption):`, payload);

        // TEMPORARY: Send unencrypted data for testing (backend has Decrypt commented out)
        // TODO: Remove this and uncomment the encrypted version once backend Decrypt is fixed
        const data_pass = JSON.stringify(payload);

        // ORIGINAL ENCRYPTED VERSION (commented out temporarily):
        // const { data, key } = Encrypt(payload);
        // const data_pass = JSON.stringify({ data, key });
        // console.log('Encrypted data being sent:', { data: data.substring(0, 50) + '...', key: key.substring(0, 50) + '...' });

        // Determine endpoint based on audience type
        const endpoint = `${campaignCreateUrl}/${audienceType === 'excel' ? 'excel' : 'excel'}`;
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
          <>
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

            {/* Schedule Campaign Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <label className="text-sm font-medium text-gray-700">Schedule Campaign</label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => {
                      setIsScheduled(e.target.checked);
                      if (!e.target.checked) {
                        setScheduleDate?.('');
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {isScheduled && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <Clock className="w-3 h-3" />
                    <span>Campaign will be sent at the scheduled time</span>
                  </div>
                  <input
                    type="datetime-local"
                    value={scheduleDate || ''}
                    onChange={(e) => setScheduleDate?.(e.target.value)}
                    min={getMinDateTime()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  {scheduleDate && (
                    <div className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                      Scheduled for: {new Date(scheduleDate).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
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
                disabled={!proceedEnabled || !campaignName || campaignName.trim() === '' || (isScheduled && !scheduleDate)}
                className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  proceedEnabled && campaignName && campaignName.trim() !== '' && (!isScheduled || scheduleDate)
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-500 text-white hover:from-indigo-600 hover:to-indigo-600 shadow-lg hover:shadow-xl'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isScheduled ? (
                  <>
                    <Calendar className="w-5 h-5" />
                    Schedule Campaign
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Launch Campaign
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}