import * as XLSX from 'xlsx';

interface ExportExcelParams {
  data: any[];
  columns: { header: string; key: string }[];
  fileName: string;
  sheetName?: string;
  companyName?: string;
}

export const exportToExcel = ({
  data,
  columns,
  fileName,
  sheetName = 'Hisobot',
  companyName = 'Avtomaktab Dream'
}: ExportExcelParams) => {
  // 1. Prepare data mapping
  const mappedData = data.map(item => {
    const row: any = {};
    columns.forEach(col => {
      // support nested keys like 'group.name'
      const value = col.key.split('.').reduce((obj, k) => (obj || {})[k], item);
      row[col.header] = value !== undefined && value !== null ? value : '';
    });
    return row;
  });

  // 2. Add Title and Metadata rows
  const dateStr = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const aoaData: any[][] = [];
  aoaData.push([companyName]);
  aoaData.push([`Yaratilgan sana: ${dateStr}`]);
  aoaData.push(columns.map(c => c.header)); // Header row

  mappedData.forEach(row => {
    aoaData.push(columns.map(c => row[c.header]));
  });

  // 3. Create workbook and worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 4. Auto-width columns
  const colWidths = columns.map(col => {
    const maxDataLength = mappedData.reduce((max, row) => {
      const val = row[col.header] ? row[col.header].toString() : '';
      return Math.max(max, val.length);
    }, col.header.length);
    return { wch: Math.min(Math.max(maxDataLength + 2, 10), 50) }; // cap width at 50
  });
  worksheet['!cols'] = colWidths;

  // 5. Download file
  XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
};
