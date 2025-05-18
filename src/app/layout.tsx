import Image from "next/image";
import Link from "next/link";
import AuthLinks from "@/components/AuthLinks"; // Import the new client component

// Assuming logos are placed in the /public/images directory
const logo1Path = "/images/1000178268.png"; 
const logo2Path = "/images/1000178267.png"; 

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Standard Next.js head elements will be here */}
      </head>
      <body>
        <header className="bg-gray-800 text-white p-4 sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2">
                <Image src={logo1Path} alt="Company Logo 1" width={40} height={40} priority />
                <span className="text-xl font-bold">QTO Web App</span>
              </Link>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="hover:text-gray-300">Home</Link>
              <Link href="/projects" className="hover:text-gray-300">Projects</Link>
              <Link href="/documentation" className="hover:text-gray-300">Documentation</Link>
              <AuthLinks /> {/* Use the client component here */}
            </nav>
          </div>
        </header>
        <main className="container mx-auto p-4">
          {children}
        </main>
        <footer className="bg-gray-200 text-center p-4 mt-8">
          <p>&copy; {new Date().getFullYear()} Your Company Name. All rights reserved.</p>
          <div className="flex justify-center items-center mt-2 space-x-2">
            <Image src={logo1Path} alt="Company Logo 1" width={30} height={30} />
            <Image src={logo2Path} alt="Company Logo 2" width={30} height={30} />
          </div>
        </footer>
      </body>
    </html>
  );
}

