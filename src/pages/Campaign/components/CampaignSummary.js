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
  tokens
}) {
  const handleProceed = () => {
    if (activeTab === 'audience') {
      setActiveTab('template');
    }
  };

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

    // Currently implement Excel audience create per provided payload/route
    if (audienceType === 'excel') {
      try {
        // Derive phone column index (1-based) from selected mapping
        const phoneIndex =
          excelMapping?.phone && Array.isArray(excelHeaders)
            ? excelHeaders.indexOf(excelMapping.phone) + 1
            : 0;

        if (!phoneIndex || phoneIndex < 1) {
          alert('Please map the phone number column in your Excel.');
          return;
        }

        // Compute start/end rows (headers are row 1)
        const startRow = 2;
        const endRow = Math.max(1 + (Array.isArray(excelData) ? excelData.length : 0), 2);

        // Use the uploaded file URL
        const fileUrl = excelFileUrl || sheetLink;
        
        if (!fileUrl || !fileUrl.startsWith('http')) {
          alert('Please upload an Excel file first. The file needs to be uploaded to the server before creating a campaign.');
          return;
        }

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
          url: excelFileUrl,
          phone_index: phoneIndex,
          start_row: startRow,
          end_row: endRow,
          name: campaignName,
          template_id: selectedTemplate.id,
          project_id: tokens?.projects?.[0]?.project_id || '689d783e207f0b0c309fa07c',
          component: formattedComponents
        };

        console.log(payload);
        

        const { data, key } = Encrypt(payload);
        const data_pass = JSON.stringify({ data, key });

        const response = await axios.post(
          'https://api.w1chat.com/campaign/create/excel',
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
          throw new Error(response?.data?.message || 'Failed to create Excel campaign');
        }

        alert('Excel campaign created successfully.');
        // Optionally navigate or reset UI here
      } catch (err) {
        console.error('Failed to create Excel campaign:', err);
        alert(err?.message || 'Failed to create Excel campaign');
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

