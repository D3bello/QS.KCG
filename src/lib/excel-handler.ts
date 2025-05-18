"use server";

import ExcelJS from 'exceljs';
import { Writable } from 'stream';
import { getCurrentAuthenticatedUser } from "./auth-actions";
import { getProjectById, Project } from "./project-actions";
import { createQTOItem, getQTOItemsForProject, QTOItem, QTOItemActionResponse } from "./qto-item-actions";

// This type is available globally in Cloudflare Workers / Pages environment
declare global {
    interface ProcessEnv {
        DB: D1Database;
    }
}

export interface ExcelSyncResponse {
    message: string | null;
    type: "success" | "error" | null;
    itemsAdded?: number;
    itemsUpdated?: number; // For future update logic
    errors?: string[];
}

// --- Excel Export Logic ---
export async function exportProjectToExcel(projectId: number): Promise<{fileName: string, buffer: Buffer | null, error?: string}> {
    const currentUser = await getCurrentAuthenticatedUser();
    if (!currentUser) {
        return { fileName: "", buffer: null, error: "User not authenticated." };
    }

    const project = await getProjectById(projectId);
    if (!project) {
        return { fileName: "", buffer: null, error: "Project not found or unauthorized." };
    }

    // RBAC: Ensure user has permission to export this project's data
    if (currentUser.role !== "Admin" && project.created_by_id !== currentUser.userId) {
        return { fileName: "", buffer: null, error: "You do not have permission to export this project." };
    }

    const qtoItems = await getQTOItemsForProject(projectId);

    try {
        const workbook = new ExcelJS.Workbook();
        // It's better to load the existing template if we want to preserve all its features, 
        // but creating from scratch is simpler if the template is complex or not available for direct loading in this env.
        // For now, let's create a new sheet with the QTO data.
        // A more advanced version would load `/home/ubuntu/quantity_takeoff_files/QTO_Template_v0.4_BOQ_Tested.xlsx`
        // and populate it.

        const qtoSheet = workbook.addWorksheet("QTO Sheet");
        qtoSheet.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "CSI Code", key: "csi_code", width: 15 },
            { header: "Item Description", key: "item_description", width: 50 },
            { header: "Quantity", key: "quantity", width: 15, style: { numFmt: "0.00" } },
            { header: "Unit", key: "unit", width: 10 },
            { header: "Unit Rate", key: "unit_rate", width: 15, style: { numFmt: "#,##0.00" } },
            { header: "Total Cost", key: "total_cost", width: 15, style: { numFmt: "#,##0.00" } },
            { header: "Notes", key: "notes", width: 30 },
            { header: "BOQ Item", key: "is_boq_item", width: 10 },
            { header: "BOQ Division", key: "boq_division", width: 20 },
        ];

        qtoItems.forEach(item => {
            qtoSheet.addRow({
                id: item.id,
                csi_code: item.csi_code,
                item_description: item.item_description,
                quantity: item.quantity,
                unit: item.unit,
                unit_rate: item.unit_rate,
                total_cost: item.total_cost, // This would be a formula in a real template
                notes: item.notes,
                is_boq_item: item.is_boq_item ? "Yes" : "No",
                boq_division: item.boq_division
            });
        });
        
        // Add a summary sheet (basic example)
        const summarySheet = workbook.addWorksheet("Summary");
        summarySheet.addRow(["Project Name:", project.project_name]);
        summarySheet.addRow(["Project Number:", project.project_number]);
        summarySheet.addRow(["Client:", project.client_name]);
        summarySheet.addRow(["Total QTO Items:", qtoItems.length]);
        const totalProjectCost = qtoItems.reduce((sum, item) => sum + (item.total_cost || 0), 0);
        summarySheet.addRow(["Total Estimated Cost:", totalProjectCost]);
        summarySheet.getCell("B5").numFmt = "#,##0.00";

        // TODO: Implement CSI BOQ Sheet generation based on `is_boq_item` and `boq_division`
        // This would involve creating another sheet and populating it by filtering qtoItems.

        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `QTO_Export_${project.project_name.replace(/\s+/g, ".")}_${new Date().toISOString().split("T")[0]}.xlsx`;
        
        return { fileName, buffer: Buffer.from(buffer) }; // Convert ArrayBuffer to Node.js Buffer

    } catch (error: any) {
        console.error("Excel export error:", error);
        return { fileName: "", buffer: null, error: "Failed to generate Excel file: " + error.message };
    }
}


// --- Excel Import Logic ---
// This is a simplified import. A robust version would handle various column mappings, error logging, and updates.
export async function importQTOFromExcel(projectId: number, fileBuffer: ArrayBuffer): Promise<ExcelSyncResponse> {
    const currentUser = await getCurrentAuthenticatedUser();
    if (!currentUser) {
        return { message: "User not authenticated.", type: "error" };
    }

    const project = await getProjectById(projectId);
    if (!project) {
        return { message: "Project not found or unauthorized.", type: "error" };
    }
    if (currentUser.role !== "Admin" && project.created_by_id !== currentUser.userId) {
        return { message: "You do not have permission to import data to this project.", type: "error" };
    }

    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.load(fileBuffer);
    } catch (error: any) {
        console.error("Excel file load error:", error);
        return { message: "Failed to read the Excel file. It might be corrupted or in an unsupported format.", type: "error" };
    }

    const qtoSheet = workbook.getWorksheet(1); // Assuming QTO data is in the first sheet
    if (!qtoSheet) {
        return { message: "No worksheet found in the Excel file.", type: "error" };
    }

    let itemsAdded = 0;
    const importErrors: string[] = [];
    const d1 = process.env.DB;

    // Determine headers - very basic, assumes specific header names in row 1
    const headerRow = qtoSheet.getRow(1).values as string[];
    const csiCodeIndex = headerRow ? headerRow.findIndex(h => h?.toLowerCase().includes("csi code")) : -1;
    const descriptionIndex = headerRow ? headerRow.findIndex(h => h?.toLowerCase().includes("description")) : -1;
    const quantityIndex = headerRow ? headerRow.findIndex(h => h?.toLowerCase().includes("quantity")) : -1;
    const unitIndex = headerRow ? headerRow.findIndex(h => h?.toLowerCase().includes("unit")) : -1;
    const unitRateIndex = headerRow ? headerRow.findIndex(h => h?.toLowerCase().includes("unit rate")) : -1;
    // Add more indices as needed: notes, is_boq_item, boq_division

    if (descriptionIndex === -1) {
        return { message: "Required 'Item Description' column not found in the Excel sheet.", type: "error" };
    }

    for (let i = 2; i <= qtoSheet.rowCount; i++) { // Start from row 2, assuming row 1 is header
        const row = qtoSheet.getRow(i);
        const itemDescription = row.getCell(descriptionIndex + 1).value as string; // +1 because cell indices are 1-based

        if (!itemDescription || itemDescription.trim() === "") {
            // Skip empty rows or rows without a description
            continue;
        }

        const quantityVal = quantityIndex !== -1 ? row.getCell(quantityIndex + 1).value : null;
        const unitRateVal = unitRateIndex !== -1 ? row.getCell(unitRateIndex + 1).value : null;
        
        const quantity = (typeof quantityVal === "number") ? quantityVal : (quantityVal ? parseFloat(quantityVal.toString()) : null);
        const unitRate = (typeof unitRateVal === "number") ? unitRateVal : (unitRateVal ? parseFloat(unitRateVal.toString()) : null);

        const qtoItemData: Omit<QTOItem, "id" | "created_by_id"> & { created_by_id: number } = {
            project_id: projectId,
            csi_code: csiCodeIndex !== -1 ? row.getCell(csiCodeIndex + 1).value as string || null : null,
            item_description: itemDescription,
            quantity: quantity,
            unit: unitIndex !== -1 ? row.getCell(unitIndex + 1).value as string || null : null,
            unit_rate: unitRate,
            total_cost: (quantity != null && unitRate != null) ? quantity * unitRate : null,
            notes: null, // Placeholder, add if column exists
            is_boq_item: false, // Placeholder
            boq_division: null, // Placeholder
            created_by_id: currentUser.userId,
        };

        try {
            const stmt = d1.prepare(
                "INSERT INTO QTO_Items (project_id, csi_code, item_description, quantity, unit, unit_rate, total_cost, notes, is_boq_item, boq_division, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            await stmt.bind(
                qtoItemData.project_id,
                qtoItemData.csi_code,
                qtoItemData.item_description,
                qtoItemData.quantity,
                qtoItemData.unit,
                qtoItemData.unit_rate,
                qtoItemData.total_cost,
                qtoItemData.notes,
                qtoItemData.is_boq_item ? 1 : 0,
                qtoItemData.boq_division,
                qtoItemData.created_by_id
            ).run();
            itemsAdded++;
        } catch (dbError: any) {
            console.error(`DB Error importing row ${i}:`, dbError);
            importErrors.push(`Row ${i} ('${itemDescription}'): ${dbError.message || "Database error"}`);
        }
    }

    if (itemsAdded > 0) {
        revalidatePath(`/projects/edit/${projectId}`);
    }

    if (importErrors.length > 0) {
        return {
            message: `Import completed with ${itemsAdded} items added and ${importErrors.length} errors.`, 
            type: "error", 
            itemsAdded, 
            errors: importErrors 
        };
    }

    return { message: `${itemsAdded} QTO items imported successfully!`, type: "success", itemsAdded };
}

