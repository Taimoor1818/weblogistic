import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function exportToExcel<T extends Record<string, unknown>>(data: T[], fileName: string, sheetName: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length > 0) {
        const columns = Object.keys(data[0]).map((key) => ({
            header: key.charAt(0).toUpperCase() + key.slice(1),
            key: key,
            width: 20,
        }));
        worksheet.columns = columns;
        worksheet.addRows(data);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `${fileName}.xlsx`);
}
