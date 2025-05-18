"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAuthenticatedUser, UserPayload } from "./auth-actions";

export interface QTOItem {
    id?: number;
    project_id: number;
    csi_code?: string | null;
    item_description: string;
    quantity?: number | null;
    unit?: string | null;
    unit_rate?: number | null;
    total_cost?: number | null; // Should be calculated: quantity * unit_rate
    notes?: string | null;
    created_by_id: number;
    is_boq_item?: boolean; // New field from schema
    boq_division?: string | null; // New field from schema
    // created_at and updated_at are handled by DB
}

export interface QTOItemActionResponse {
    message: string | null;
    type: "success" | "error" | null;
    qtoItemId?: number;
    errors?: Record<string, string>;
}

// Helper function to calculate total cost
function calculateTotalCost(quantity?: number | null, unitRate?: number | null): number | null {
    if (quantity != null && unitRate != null) {
        return quantity * unitRate;
    }
    return null;
}

export async function createQTOItem(projectId: number, prevState: QTOItemActionResponse, formData: FormData): Promise<QTOItemActionResponse> {
    const d1 = process.env.DB;
    const currentUser = await getCurrentAuthenticatedUser();

    if (!currentUser) {
        return { message: "User not authenticated. Please login.", type: "error" };
    }

    // RBAC: Check if user can add QTO items to this project (e.g., Admin, or creator/manager of the project)
    const project = await d1.prepare("SELECT created_by_id FROM Projects WHERE id = ?").bind(projectId).first<{created_by_id: number}>();
    if (!project) {
        return { message: "Project not found.", type: "error" };
    }
    if (currentUser.role !== "Admin" && project.created_by_id !== currentUser.userId) {
        // More granular roles like "Project Member" with write access could be added
        return { message: "You do not have permission to add items to this project.", type: "error" };
    }

    const quantity = formData.get("quantity") ? parseFloat(formData.get("quantity") as string) : null;
    const unitRate = formData.get("unitRate") ? parseFloat(formData.get("unitRate") as string) : null;

    const qtoItemData: Omit<QTOItem, "id" | "created_by_id"> & { created_by_id: number } = {
        project_id: projectId,
        csi_code: formData.get("csiCode") as string || null,
        item_description: formData.get("itemDescription") as string,
        quantity: quantity,
        unit: formData.get("unit") as string || null,
        unit_rate: unitRate,
        total_cost: calculateTotalCost(quantity, unitRate),
        notes: formData.get("notes") as string || null,
        is_boq_item: formData.get("isBoqItem") === "on" || formData.get("isBoqItem") === "true",
        boq_division: formData.get("boqDivision") as string || null,
        created_by_id: currentUser.userId,
    };

    if (!qtoItemData.item_description) {
        return { message: "Item Description is required.", type: "error", errors: { itemDescription: "Item Description is required." } };
    }

    try {
        const stmt = d1.prepare(
            "INSERT INTO QTO_Items (project_id, csi_code, item_description, quantity, unit, unit_rate, total_cost, notes, is_boq_item, boq_division, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        const result = await stmt.bind(
            qtoItemData.project_id,
            qtoItemData.csi_code,
            qtoItemData.item_description,
            qtoItemData.quantity,
            qtoItemData.unit,
            qtoItemData.unit_rate,
            qtoItemData.total_cost,
            qtoItemData.notes,
            qtoItemData.is_boq_item ? 1 : 0, // SQLite stores booleans as 0 or 1
            qtoItemData.boq_division,
            qtoItemData.created_by_id
        ).run();
        
        revalidatePath(`/projects/edit/${projectId}`); // Revalidate the project page where QTO items are shown
        return { message: "QTO Item added successfully!", type: "success", qtoItemId: result.meta.last_row_id };

    } catch (error: any) {
        console.error("Create QTO Item error:", error.message, error.cause);
        return { message: "Failed to add QTO Item due to a server error.", type: "error" };
    }
}

export async function getQTOItemsForProject(projectId: number): Promise<QTOItem[]> {
    const d1 = process.env.DB;
    const currentUser = await getCurrentAuthenticatedUser();
    if (!currentUser) return [];

    // RBAC: Check if user can view QTO items for this project
    const project = await d1.prepare("SELECT created_by_id FROM Projects WHERE id = ?").bind(projectId).first<{created_by_id: number}>();
    if (!project) return []; // Project not found
    if (currentUser.role !== "Admin" && project.created_by_id !== currentUser.userId) {
        return []; // No permission
    }

    try {
        const { results } = await d1.prepare("SELECT * FROM QTO_Items WHERE project_id = ? ORDER BY created_at DESC").bind(projectId).all<QTOItem>();
        return results.map(item => ({ ...item, is_boq_item: Boolean(item.is_boq_item) })) || []; // Convert 0/1 back to boolean
    } catch (error: any) {
        console.error("Get QTO Items error:", error.message, error.cause);
        return [];
    }
}

export async function updateQTOItem(qtoItemId: number, prevState: QTOItemActionResponse, formData: FormData): Promise<QTOItemActionResponse> {
    const d1 = process.env.DB;
    const currentUser = await getCurrentAuthenticatedUser();

    if (!currentUser) {
        return { message: "User not authenticated.", type: "error" };
    }

    const itemToUpdate = await d1.prepare("SELECT project_id, created_by_id FROM QTO_Items WHERE id = ?").bind(qtoItemId).first<{project_id: number, created_by_id: number}>();
    if (!itemToUpdate) {
        return { message: "QTO Item not found.", type: "error" };
    }

    // RBAC: Check permissions (Admin or creator of item/project)
    const project = await d1.prepare("SELECT created_by_id FROM Projects WHERE id = ?").bind(itemToUpdate.project_id).first<{created_by_id: number}>();
    if (!project) return { message: "Associated project not found.", type: "error" };

    if (currentUser.role !== "Admin" && itemToUpdate.created_by_id !== currentUser.userId && project.created_by_id !== currentUser.userId) {
        return { message: "You do not have permission to update this item.", type: "error" };
    }

    const quantity = formData.get("quantity") ? parseFloat(formData.get("quantity") as string) : null;
    const unitRate = formData.get("unitRate") ? parseFloat(formData.get("unitRate") as string) : null;

    const qtoItemData: Omit<QTOItem, "id" | "project_id" | "created_by_id"> & { updated_at?: string } = {
        csi_code: formData.get("csiCode") as string || null,
        item_description: formData.get("itemDescription") as string,
        quantity: quantity,
        unit: formData.get("unit") as string || null,
        unit_rate: unitRate,
        total_cost: calculateTotalCost(quantity, unitRate),
        notes: formData.get("notes") as string || null,
        is_boq_item: formData.get("isBoqItem") === "on" || formData.get("isBoqItem") === "true",
        boq_division: formData.get("boqDivision") as string || null,
        updated_at: new Date().toISOString(),
    };

    if (!qtoItemData.item_description) {
        return { message: "Item Description is required.", type: "error", errors: { itemDescription: "Item Description is required." } };
    }

    try {
        const stmt = d1.prepare(
            "UPDATE QTO_Items SET csi_code = ?, item_description = ?, quantity = ?, unit = ?, unit_rate = ?, total_cost = ?, notes = ?, is_boq_item = ?, boq_division = ?, updated_at = ? WHERE id = ?"
        );
        await stmt.bind(
            qtoItemData.csi_code,
            qtoItemData.item_description,
            qtoItemData.quantity,
            qtoItemData.unit,
            qtoItemData.unit_rate,
            qtoItemData.total_cost,
            qtoItemData.notes,
            qtoItemData.is_boq_item ? 1 : 0,
            qtoItemData.boq_division,
            qtoItemData.updated_at,
            qtoItemId
        ).run();
        
        revalidatePath(`/projects/edit/${itemToUpdate.project_id}`);
        return { message: "QTO Item updated successfully!", type: "success", qtoItemId };

    } catch (error: any) {
        console.error("Update QTO Item error:", error.message, error.cause);
        return { message: "Failed to update QTO Item due to a server error.", type: "error" };
    }
}

export async function deleteQTOItem(qtoItemId: number): Promise<QTOItemActionResponse> {
    const d1 = process.env.DB;
    const currentUser = await getCurrentAuthenticatedUser();

    if (!currentUser) {
        return { message: "User not authenticated.", type: "error" };
    }

    const itemToDelete = await d1.prepare("SELECT project_id, created_by_id FROM QTO_Items WHERE id = ?").bind(qtoItemId).first<{project_id: number, created_by_id: number}>();
    if (!itemToDelete) {
        return { message: "QTO Item not found.", type: "error" };
    }

    const project = await d1.prepare("SELECT created_by_id FROM Projects WHERE id = ?").bind(itemToDelete.project_id).first<{created_by_id: number}>();
    if (!project) return { message: "Associated project not found.", type: "error" };

    if (currentUser.role !== "Admin" && itemToDelete.created_by_id !== currentUser.userId && project.created_by_id !== currentUser.userId) {
        return { message: "You do not have permission to delete this item.", type: "error" };
    }

    try {
        await d1.prepare("DELETE FROM QTO_Items WHERE id = ?").bind(qtoItemId).run();
        revalidatePath(`/projects/edit/${itemToDelete.project_id}`);
        return { message: "QTO Item deleted successfully.", type: "success" };
    } catch (error: any) {
        console.error(`Delete QTO Item error (${qtoItemId}):`, error.message, error.cause);
        return { message: "Failed to delete QTO Item.", type: "error" };
    }
}

