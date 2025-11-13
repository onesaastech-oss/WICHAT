import React from 'react';
import { Phone, User } from 'lucide-react';

export default function GoogleSheet({ sheetLink, setSheetLink, excelMapping, setExcelMapping }) {
  return (
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
  );
}

