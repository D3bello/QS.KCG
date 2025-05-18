"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { createProject, ProjectActionResponse } from "@/lib/project-actions";
import { useEffect, useRef } from "react";
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
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            type="submit"
            aria-disabled={pending}
            disabled={pending}
        >
            {pending ? "Creating Project..." : "Create Project"}
        </button>
    );
}

export default function NewProjectPage() {
    const [state, formAction] = useFormState(createProject, initialState);
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.type === "success" && state.projectId) {
            console.log("Project created successfully, ID:", state.projectId);
            formRef.current?.reset();
            // Redirect to the new project's edit page or the projects list
            router.push(`/projects/edit/${state.projectId}`); 
        }
        if (state.type === "error") {
            console.error("Create project error:", state.message, state.errors);
        }
    }, [state, router]);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Add New Project</h1>
            <form ref={formRef} action={formAction} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                {/* Project Name */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectName">
                        Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        className={`shadow appearance-none border ${state.errors?.projectName ? "border-red-500" : "border-gray-200"} rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                        id="projectName" name="projectName" type="text" placeholder="Enter project name" required
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
                        id="projectNumber" name="projectNumber" type="text" placeholder="Enter project number"
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
                        id="clientName" name="clientName" type="text" placeholder="Enter client name"
                    />
                </div>
                
                {/* Client Contact */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="clientContact">
                        Client Contact
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="clientContact" name="clientContact" type="text" placeholder="Enter client contact details"
                    />
                </div>

                {/* Project Address */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectAddress">
                        Project Address
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="projectAddress" name="projectAddress" placeholder="Enter project address"
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
                            id="startDate" name="startDate" type="date"
                        />
                    </div>

                    {/* Expected End Date */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expectedEndDate">
                            Expected End Date
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="expectedEndDate" name="expectedEndDate" type="date"
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
                        defaultValue="Planning">
                        <option value="Planning">Planning</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Project Manager - Placeholder, needs user selection component */}
                {/* <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectManager">
                        Project Manager
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="projectManager" name="projectManager" type="text" placeholder="Assign project manager ID"
                    />
                </div> */}

                {/* Project Description */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="projectDescription">
                        Project Description/Scope
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24"
                        id="projectDescription" name="projectDescription" placeholder="Enter project description"
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
                            id="contractValue" name="contractValue" type="number" step="0.01" placeholder="Enter contract value"
                        />
                    </div>
                    {/* Currency */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currency">
                            Currency
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="currency" name="currency" type="text" placeholder="e.g., USD, EUR" defaultValue="USD"
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
                        id="keyReferenceNumbers" name="keyReferenceNumbers" type="text" placeholder="e.g., PO-123, INV-456 (comma-separated)"
                    />
                </div>

                {state.message && state.type === "error" && (
                     <div className="mb-4 p-3 rounded text-center bg-red-100 text-red-700">
                        {state.message}
                    </div>
                )}
                 {state.message && state.type === "success" && (
                     <div className="mb-4 p-3 rounded text-center bg-green-100 text-green-700">
                        {state.message}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <SubmitButton />
                    <Link href="/projects" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                        Cancel
                    </Link>
                </div>
            </form>
        </div>
    );
}

