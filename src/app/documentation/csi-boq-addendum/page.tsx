import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

// Helper function to read markdown file content
function getMarkdownContent(filename: string): string {
    const filePath = path.join(process.cwd(), '..', 'quantity_takeoff_files', filename);
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading markdown file ${filename}:`, error);
        return `Error: Could not load content for ${filename}. Please check server logs.`;
    }
}

export default function CsiBoqAddendumPage() {
    const markdownContent = getMarkdownContent('CSI_BOQ_User_Guide_Addendum.md');

    return (
        <div className="container mx-auto p-4">
            <Link href="/documentation" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
                &larr; Back to Documentation
            </Link>
            <article className="prose lg:prose-xl max-w-none bg-white shadow-md rounded p-6">
                <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </article>
        </div>
    );
}

