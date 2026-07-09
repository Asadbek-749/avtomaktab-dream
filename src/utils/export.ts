import * as XLSX from 'xlsx';

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  // Extract headers
  const headers = Object.keys(data[0]);
  
  // Convert rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      let cell = row[header] === null || row[header] === undefined ? '' : row[header];
      cell = String(cell).replace(/"/g, '""');
      if (cell.search(/("|,|\n)/g) >= 0) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(',');
  });

  // Combine headers and rows
  const csvString = [headers.join(','), ...csvRows].join('\n');
  
  // Add BOM for UTF-8 Excel compatibility
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportToExcel = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Hisobot");
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};
