import Link from 'next/link';

export default function DocumentationPage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Documentation</h1>
            <p className="mb-4">Welcome to the documentation section. Here you can find user guides and other helpful information about the QTO Web App and the Excel template.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white shadow-md rounded p-6">
                    <h2 className="text-xl font-semibold mb-3">QTO Excel Template User Guide</h2>
                    <p className="text-gray-700 mb-4">
                        A comprehensive guide to using the Quantity Takeoff (QTO) Excel template, including details on sheets, data entry, calculations, revision tracking, and BOQ integration.
                    </p>
                    <Link href="/documentation/qto-template-guide" className="text-blue-500 hover:text-blue-700 font-semibold">
                        Read QTO Template Guide &rarr;
                    </Link>
                </div>

                <div className="bg-white shadow-md rounded p-6">
                    <h2 className="text-xl font-semibold mb-3">CSI BOQ User Guide Addendum</h2>
                    <p className="text-gray-700 mb-4">
                        An addendum to the main user guide, focusing specifically on the design and integration of the dedicated CSI Bill of Quantities (BOQ) sheet.
                    </p>
                    <Link href="/documentation/csi-boq-addendum" className="text-blue-500 hover:text-blue-700 font-semibold">
                        Read CSI BOQ Addendum &rarr;
                    </Link>
                </div>

                {/* Add more documentation links here as needed */}
            </div>
        </div>
    );
}

