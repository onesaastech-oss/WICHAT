import * as XLSX from 'xlsx';

/**
 * Parses an Excel file and returns headers and data
 * @param {File} file - The Excel file to parse
 * @returns {Promise<{headers: string[], data: Array}>} Object containing headers and parsed data
 */
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const arrayBuffer = new Uint8Array(e.target.result);
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }
        
        // First row contains headers
        const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h);
        
        // Rest of the rows contain data
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));
        
        // Convert rows to objects with headers as keys
        const parsedData = rows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] !== undefined && row[index] !== null ? String(row[index]).trim() : '';
          });
          return obj;
        });
        
        resolve({ headers, data: parsedData });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Extracts contacts from parsed Excel data based on column mapping
 * @param {Array} data - Parsed Excel data
 * @param {string} phoneColumn - Name of the phone column
 * @param {string} nameColumn - Name of the name column
 * @returns {Array} Array of contact objects with name and phone
 */
export const extractContacts = (data, phoneColumn, nameColumn) => {
  if (!phoneColumn || !nameColumn) {
    return [];
  }
  
  return data
    .filter(row => row[phoneColumn] && row[phoneColumn].trim() !== '')
    .map((row, index) => ({
      id: `excel_${index + 1}`,
      name: row[nameColumn] || '',
      phone: String(row[phoneColumn]).trim(),
      status: 'active',
      source: 'excel'
    }));
};

