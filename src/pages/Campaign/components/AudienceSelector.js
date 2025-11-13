import React from 'react';
import { Users, FileSpreadsheet, Link2 } from 'lucide-react';
import ContactsSelector from './AudienceType/ContactsSelector';
import ExcelUpload from './AudienceType/ExcelUpload';
import GoogleSheet from './AudienceType/GoogleSheet';
import GroupsSelector from './AudienceType/GroupsSelector';

export default function AudienceSelector({
  audienceType,
  setAudienceType,
  selectedContacts,
  setSelectedContacts,
  setSelectedContactDetails,
  selectedGroups,
  setSelectedGroups,
  excelMapping,
  setExcelMapping,
  sheetLink,
  setSheetLink,
  excelContacts,
  setExcelContacts,
  excelHeaders,
  setExcelHeaders,
  excelData,
  setExcelData,
  onExcelFileUploaded,
  tokens
}) {
  return (
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
        <ContactsSelector
          selectedContacts={selectedContacts}
          setSelectedContacts={setSelectedContacts}
          setSelectedContactDetails={setSelectedContactDetails}
        />
      )}

      {audienceType === 'excel' && (
        <ExcelUpload
          excelMapping={excelMapping}
          setExcelMapping={setExcelMapping}
          onContactsExtracted={(contacts) => {
            setExcelContacts(contacts);
            // Log contacts as JSON for debugging
            console.log('Extracted contacts:', JSON.stringify(contacts, null, 2));
          }}
          onHeadersExtracted={(headers) => {
            setExcelHeaders(headers);
          }}
          onFileUploaded={onExcelFileUploaded}
          tokens={tokens}
        />
      )}

      {audienceType === 'sheet' && (
        <GoogleSheet
          sheetLink={sheetLink}
          setSheetLink={setSheetLink}
          excelMapping={excelMapping}
          setExcelMapping={setExcelMapping}
          onContactsExtracted={(contacts) => {
            setExcelContacts(contacts);
            // Log contacts as JSON for debugging
            console.log('Extracted contacts from Google Sheet:', JSON.stringify(contacts, null, 2));
          }}
          onHeadersExtracted={(headers) => {
            setExcelHeaders(headers);
          }}
          onDataExtracted={(data) => {
            setExcelData(data);
          }}
        />
      )}

      {audienceType === 'groups' && (
        <GroupsSelector
          selectedGroups={selectedGroups}
          setSelectedGroups={setSelectedGroups}
        />
      )}
    </div>
  );
}

