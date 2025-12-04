import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function exportToExcel<T extends Record<string, unknown>>(
    data: T[], 
    fileName: string, 
    sheetName: string,
    companyName: string,
    columnColors?: Record<string, string>
) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add company header
    worksheet.mergeCells('A1:G1');
    const headerCell = worksheet.getCell('A1');
    headerCell.value = companyName;
    headerCell.font = { bold: true, size: 16 };
    headerCell.alignment = { horizontal: 'center' };
    
    // Add empty row for spacing
    worksheet.addRow([]);

    if (data.length > 0) {
        const columns = Object.keys(data[0]).map((key) => ({
            header: key.charAt(0).toUpperCase() + key.slice(1),
            key: key,
            width: 20,
        }));
        worksheet.columns = columns;
        
        // Add headers with styling
        const headerRow = worksheet.getRow(3);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEEEEEE' },
            };
            cell.alignment = { horizontal: 'center' };
        });
        
        // Add data rows
        data.forEach((item, index) => {
            const row = worksheet.addRow(item);
            // Center align all cells
            row.eachCell((cell) => {
                cell.alignment = { horizontal: 'center' };
                
                // Apply color based on type if provided
                if (columnColors && typeof item === 'object' && 'Type' in item) {
                    const type = (item as any).Type;
                    if (columnColors[type]) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: columnColors[type] },
                        };
                    }
                }
            });
        });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const timestamp = new Date().toISOString().split('T')[0];
    saveAs(blob, `${fileName}_${timestamp}.xlsx`);
}