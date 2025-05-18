"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAuthenticatedUser, UserPayload } from "./auth-actions"; 

export interface Project {
    id?: number;
    project_name: string;
    project_number?: string | null;
    client_name?: string | null;
    client_contact?: string | null;
    project_address?: string | null;
    start_date?: string | null;
    expected_end_date?: string | null;
    actual_end_date?: string | null;
    project_status?: string;
    project_manager_id?: number | null; 
    project_description?: string | null;
    contract_value?: number | null;
    currency?: string | null;
    key_reference_numbers?: string | null;
    created_by_id: number; 
}

export interface ProjectActionResponse {
    message: string | null;
    type: "success" | "error" | null;
    projectId?: number;
    errors?: Record<string, string>;
}


export async function createProject(prevState: ProjectActionResponse, formData: FormData): Promise<ProjectActionResponse> {
    const d1 = process.env.DB;
    const currentUser = await getCurrentAuthenticatedUser();

    if (!currentUser) {
        return { message: "User not authenticated. Please login.", type: "error" };
    }

    // RBAC check: Only Admin, Project Manager, or Data Entry can create projects
    if (!["Admin", "Project Manager", "Data Entry"].includes(currentUser.role)) {
        return { message: "You do not have permission to create projects.", type: "error" };
    }

    const projectData: Project = {
        project_name: formData.get("projectName") as string,
        project_number: formData.get("projectNumber") as string || null,
        client_name: formData.get("clientName") as string || null,
        client_contact: formData.get("clientContact") as string || null,
        project_address: formData.get("projectAddress") as string || null,
        start_date: formData.get("startDate") as string || null,
        expected_end_date: formData.get("expectedEndDate") as string || null,
        project_status: formData.get("projectStatus") as string || "Planning",
        project_description: formData.get("projectDescription") as string || null,
        contract_value: formData.get("contractValue") ? parseFloat(formData.get("contractValue") as string) : null,
        currency: formData.get("currency") as string || "USD",
        key_reference_numbers: formData.get("keyReferenceNumbers") as string || null,
        created_by_id: currentUser.userId,
    };

    if (!projectData.project_name) {
        return { message: "Project Name is required.", type: "error", errors: { projectName: "Project Name is required." } };
    }

    try {
        const stmt = d1.prepare(
            "INSERT INTO Projects (project_name, project_number, client_name, client_contact, project_address, start_date, expected_end_date, project_status, project_description, contract_value, currency, key_reference_numbers, created_by_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        const result = await stmt.bind(
            projectData.project_name,
            projectData.project_number,
            projectData.client_name,
            projectData.client_contact,
            projectData.project_address,
            projectData.start_date,
            projectData.expected_end_date,
            projectData.project_status,
            projectData.project_description,
            projectData.contract_value,
            projectData.currency,
            projectData.key_reference_numbers,
            projectData.created_by_id
        ).run();
        
        revalidatePath("/projects"); 
        return { message: "Project created successfully!", type: "success", projectId: result.meta.last_row_id };

    } catch (error: any) {
        console.error("Create project error:", error.message, error.cause);
        if (error.cause && typeof error.cause.message === "string" && error.cause.message.includes("UNIQUE constraint failed: Projects.project_number")) {
            return { message: "Project Number must be unique.", type: "error", errors: { projectNumber: "This Project Number is already in use."}};
        }
        return { message: "Failed to create project due to a server error.", type: "error" };
    }
}

export async function getProjects(): Promise<Project[]> {
    const d1 = process.env.DB;
    const currentUser = await getCurrentAuthenticatedUser();
    if (!currentUser) return []; // Must be logged in to see projects

    // RBAC: Admins see all. Others see projects they created (example logic)
    // This could be expanded to include projects they are assigned to as Project Manager if that field is linked to Users table
    try {
        let query;
        if (currentUser.role === "Admin") {
            query = d1.prepare("SELECT * FROM Projects ORDER BY created_at DESC");
        } else {
            // Non-admins see only their own projects for now
            query = d1.prepare("SELECT * FROM Projects WHERE created_by_id = ? ORDER BY created_at DESC").bind(currentUser.userId);
        }
        const { results } = await query.all<Project>();
        return results || [];
    } catch (error: any) {
        console.error("Get projects error:", error.message, error.cause);
        return [];
    }
}

export async function getProjectById(id: number): Promise<Project | null> {
    const d1 = process.env.DB;
    const currentUser = await getCurrentAuthenticatedUser();
    if (!currentUser) return null; 

    try {
        const project = await d1.prepare("SELECT * FROM Projects WHERE id = ?").bind(id).first<Project>();
        if (!project) return null;

        // RBAC: Admin can see any project. Others can only see their own.
        if (currentUser.role !== "Admin" && project.created_by_id !== currentUser.userId) {
            console.warn(`User ${currentUser.userId} (${currentUser.role}) attempted to access unauthorized project ${id}`);
            return null; 
        }
        return project;
    } catch (error: any) {
        console.error(`Get project by ID (${id}) error:`, error.message, error.cause);
        return null;
    }
}

export async function updateProject(projectId: number, prevState: ProjectActionResponse, formData: FormData): Promise<ProjectActionResponse> {
    const d1 = process.env.DB;
    const currentUser = await getCurrentAuthenticatedUser();

    if (!currentUser) {
        return { message: "User not authenticated. Please login.", type: "error" };
    }

    const projectToUpdate = await d1.prepare("SELECT created_by_id FROM Projects WHERE id = ?").bind(projectId).first<{created_by_id: number}>();
    if (!projectToUpdate) {
        return { message: "Project not found or you do not have permission to update it.", type: "error" };
    }

    // RBAC: Only Admin or the user who created the project can update it.
    if (currentUser.role !== "Admin" && projectToUpdate.created_by_id !== currentUser.userId) {
        return { message: "You do not have permission to update this project.", type: "error" };
    }

    const projectData: Omit<Project, "created_by_id" | "id"> & { updated_at?: string } = {
        project_name: formData.get("projectName") as string,
        project_number: formData.get("projectNumber") as string || null,
        client_name: formData.get("clientName") as string || null,
        client_contact: formData.get("clientContact") as string || null,
        project_address: formData.get("projectAddress") as string || null,
        start_date: formData.get("startDate") as string || null,
        expected_end_date: formData.get("expectedEndDate") as string || null,
        project_status: formData.get("projectStatus") as string || "Planning",
        project_description: formData.get("projectDescription") as string || null,
        contract_value: formData.get("contractValue") ? parseFloat(formData.get("contractValue") as string) : null,
        currency: formData.get("currency") as string || "USD",
        key_reference_numbers: formData.get("keyReferenceNumbers") as string || null,
        updated_at: new Date().toISOString() 
    };

    if (!projectData.project_name) {
        return { message: "Project Name is required.", type: "error", errors: { projectName: "Project Name is required." } };
    }

    try {
        const stmt = d1.prepare(
            "UPDATE Projects SET project_name = ?, project_number = ?, client_name = ?, client_contact = ?, project_address = ?, start_date = ?, expected_end_date = ?, project_status = ?, project_description = ?, contract_value = ?, currency = ?, key_reference_numbers = ?, updated_at = ? WHERE id = ?"
        );
        await stmt.bind(
            projectData.project_name,
            projectData.project_number,
            projectData.client_name,
            projectData.client_contact,
            projectData.project_address,
            projectData.start_date,
            projectData.expected_end_date,
            projectData.project_status,
            projectData.project_description,
            projectData.contract_value,
            projectData.currency,
            projectData.key_reference_numbers,
            projectData.updated_at,
            projectId
        ).run();
        
        revalidatePath("/projects");
        revalidatePath(`/projects/edit/${projectId}`);
        return { message: "Project updated successfully!", type: "success", projectId };

    } catch (error: any) {
        console.error("Update project error:", error.message, error.cause);
         if (error.cause && typeof error.cause.message === "string" && error.cause.message.includes("UNIQUE constraint failed: Projects.project_number")) {
            return { message: "Project Number must be unique.", type: "error", errors: { projectNumber: "This Project Number is already in use."}};
        }
        return { message: "Failed to update project due to a server error.", type: "error" };
    }
}

export async function deleteProject(projectId: number): Promise<ProjectActionResponse> {
    const d1 = process.env.DB;
    const currentUser = await getCurrentAuthenticatedUser();

    if (!currentUser) {
        return { message: "User not authenticated. Please login.", type: "error" };
    }

    const projectToDelete = await d1.prepare("SELECT created_by_id FROM Projects WHERE id = ?").bind(projectId).first<{created_by_id: number}>();
    if (!projectToDelete) {
        return { message: "Project not found or you do not have permission to delete it.", type: "error" };
    }

    // RBAC: Only Admin or the user who created the project can delete it.
    if (currentUser.role !== "Admin" && projectToDelete.created_by_id !== currentUser.userId) {
        return { message: "You do not have permission to delete this project.", type: "error" };
    }

    try {
        // Before deleting a project, consider related data (QTO sheets, etc.) if they exist.
        // For now, direct delete.
        await d1.prepare("DELETE FROM Projects WHERE id = ?").bind(projectId).run();
        revalidatePath("/projects");
        return { message: "Project deleted successfully.", type: "success" };
    } catch (error: any) {
        console.error(`Delete project error (${projectId}):`, error.message, error.cause);
        return { message: "Failed to delete project.", type: "error" };
    }
}

