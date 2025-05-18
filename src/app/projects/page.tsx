"use client"; // For potential client-side interactions like delete confirmation

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProjects, deleteProject, Project, ProjectActionResponse } from "@/lib/project-actions";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMessage, setActionMessage] = useState<ProjectActionResponse | null>(null);

    useEffect(() => {
        async function loadProjects() {
            setIsLoading(true);
            try {
                const fetchedProjects = await getProjects();
                setProjects(fetchedProjects);
            } catch (e: any) {
                setError("Failed to load projects: " + e.message);
            }
            setIsLoading(false);
        }
        loadProjects();
    }, []);

    const handleDelete = async (projectId: number) => {
        if (window.confirm("Are you sure you want to delete this project?")) {
            const response = await deleteProject(projectId);
            setActionMessage(response);
            if (response.type === "success") {
                setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
            }
        }
    };

    if (isLoading) {
        return <div className="container mx-auto p-4 text-center">Loading projects...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Projects</h1>
                <Link href="/projects/new" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Add New Project
                </Link>
            </div>

            {actionMessage && (
                <div className={`mb-4 p-3 rounded text-center ${actionMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {actionMessage.message}
                </div>
            )}

            {projects.length === 0 ? (
                <p className="text-gray-600">No projects found. Get started by adding a new project.</p>
            ) : (
                <div className="bg-white shadow-md rounded my-6">
                    <table className="min-w-max w-full table-auto">
                        <thead>
                            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                                <th className="py-3 px-6 text-left">Project Name</th>
                                <th className="py-3 px-6 text-left">Project Number</th>
                                <th className="py-3 px-6 text-center">Status</th>
                                <th className="py-3 px-6 text-center">Client</th>
                                <th className="py-3 px-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {projects.map((project) => (
                                <tr key={project.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-3 px-6 text-left whitespace-nowrap">
                                        <Link href={`/projects/edit/${project.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                                            {project.project_name}
                                        </Link>
                                    </td>
                                    <td className="py-3 px-6 text-left">
                                        {project.project_number || "N/A"}
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <span className={`bg-purple-200 text-purple-600 py-1 px-3 rounded-full text-xs`}>
                                            {project.project_status || "N/A"}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        {project.client_name || "N/A"}
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <div className="flex item-center justify-center space-x-2">
                                            <Link href={`/projects/edit/${project.id}`} className="w-4 mr-2 transform hover:text-purple-500 hover:scale-110">
                                                {/* Edit Icon (Placeholder) */}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </Link>
                                            <button 
                                                onClick={() => project.id && handleDelete(project.id)} 
                                                className="w-4 mr-2 transform hover:text-red-500 hover:scale-110 text-red-400"
                                                title="Delete Project"
                                            >
                                                {/* Delete Icon (Placeholder) */}
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

