"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { getProjectById, updateProject, Project, ProjectActionResponse } from "@/lib/project-actions";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

const initialState: ProjectActionResponse = {
    message: null,
    type: null,
    errors: {},
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="submit"
            aria-disabled={pending}
            disabled={pending}
        >
            {pending ? "Updating Project..." : "Update Project"}
        </button>
    );
}

interface EditProjectPageProps {
    params: {
        id: string;
    };
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
    const projectId = parseInt(params.id);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    // Bind projectId to updateProject server action
    const updateProjectWithId = updateProject.bind(null, projectId);
    const [state, formAction] = useFormState(updateProjectWithId, initialState);

    useEffect(() => {
        async function loadProject() {
            if (isNaN(projectId)) {
                setLoadError("Invalid Project ID.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const fetchedProject = await getProjectById(projectId);
                if (fetchedProject) {
                    setProject(fetchedProject);
                } else {
                    setLoadError("Project not found.");
                }
            } catch (e: any) {
                setLoadError("Failed to load project: " + e.message);
            }
            setIsLoading(false);
        }
        loadProject();
    }, [projectId]);

    useEffect(() => {
        if (state.type === "success") {
            console.log("Project updated successfully, ID:", state.projectId);
            // Optionally, re-fetch project data if not redirecting immediately
            // router.push("/projects"); // Or redirect to projects list
            // For now, just show success message and stay on page
        }
        if (state.type === "error") {
            console.error("Update project error:", state.message, state.errors);
        }
    }, [state, router]);

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center">Loading project details...</div>;
    }

    if (loadError) {
        return (
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
                <p className="text-red-500">{loadError}</p>
                <Link href="/projects" className="text-blue-500 hover:text-blue-800">
                    Back to Projects
                </Link>
            </div>
        );
    }

    if (!project) {
        // This case should ideally be covered by loadError, but as a fallback:
        return (
            <div className="container mx-auto p-4">
                 <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
                <p className="text-red-500">Project data could not be loaded.</p>
                <Link href="/projects" className="text-blue-500 hover:text-blue-800">
                    Back to Projects
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Edit Project: {project.project_name}</h1>
            <form ref={formRef} action={formAction} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                {/* Project Name */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectName">
                        Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        className={`shadow appearance-none border ${state.errors?.projectName ? "border-red-500" : "border-gray-200"} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                        id="projectName" name="projectName" type="text" placeholder="Enter project name" defaultValue={project.project_name} required
                    />
                    {state.errors?.projectName && <p className="text-red-500 text-xs italic">{state.errors.projectName}</p>}
                </div>

                {/* Project Number */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectNumber">
                        Project Number
                    </label>
                    <input
                        className={`shadow appearance-none border ${state.errors?.projectNumber ? "border-red-500" : "border-gray-200"} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                        id="projectNumber" name="projectNumber" type="text" placeholder="Enter project number" defaultValue={project.project_number || ""}
                    />
                    {state.errors?.projectNumber && <p className="text-red-500 text-xs italic">{state.errors.projectNumber}</p>}
                </div>

                {/* Client Name */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clientName">
                        Client Name
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="clientName" name="clientName" type="text" placeholder="Enter client name" defaultValue={project.client_name || ""}
                    />
                </div>
                
                {/* Client Contact */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clientContact">
                        Client Contact
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="clientContact" name="clientContact" type="text" placeholder="Enter client contact details" defaultValue={project.client_contact || ""}
                    />
                </div>

                {/* Project Address */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectAddress">
                        Project Address
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="projectAddress" name="projectAddress" placeholder="Enter project address" defaultValue={project.project_address || ""}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
                            Start Date
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="startDate" name="startDate" type="date" defaultValue={project.start_date?.split("T")[0] || ""} // Format for date input
                        />
                    </div>

                    {/* Expected End Date */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expectedEndDate">
                            Expected End Date
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="expectedEndDate" name="expectedEndDate" type="date" defaultValue={project.expected_end_date?.split("T")[0] || ""} // Format for date input
                        />
                    </div>
                </div>
                
                {/* Project Status */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectStatus">
                        Project Status
                    </label>
                    <select 
                        id="projectStatus" 
                        name="projectStatus"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        defaultValue={project.project_status || "Planning"}>
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Project Description */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectDescription">
                        Project Description/Scope
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                        id="projectDescription" name="projectDescription" placeholder="Enter project description" defaultValue={project.project_description || ""}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contract Value */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="contractValue">
                            Contract Value
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="contractValue" name="contractValue" type="number" step="0.01" placeholder="Enter contract value" defaultValue={project.contract_value?.toString() || ""}
                        />
                    </div>
                    {/* Currency */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currency">
                            Currency
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="currency" name="currency" type="text" placeholder="e.g., USD, EUR" defaultValue={project.currency || "USD"}
                        />
                    </div>
                </div>

                {/* Key Reference Numbers */}
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="keyReferenceNumbers">
                        Key Reference Numbers
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="keyReferenceNumbers" name="keyReferenceNumbers" type="text" placeholder="e.g., PO-123, INV-456 (comma-separated)" defaultValue={project.key_reference_numbers || ""}
                    />
                </div>

                {state.message && (
                     <div className={`mb-4 p-3 rounded text-center ${state.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {state.message}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <SubmitButton />
                    <Link href="/projects" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                        Back to Projects
                    </Link>
                </div>
            </form>
        </div>
    );
}

