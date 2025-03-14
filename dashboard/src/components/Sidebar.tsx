'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 hidden md:block bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.svg"
            alt="CircuFert Logo"
            width={150}
            height={40}
            priority
          />
        </div>
        <nav className="space-y-1">
          <Link 
            href="/CircuFert" 
            className={`flex items-center px-4 py-2.5 text-gray-900 dark:text-white rounded-md font-medium transition-colors ${
              pathname === '/CircuFert' 
                ? 'bg-blue-50 dark:bg-blue-900' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            <div className="flex flex-col">
              <span>Dashboard</span>
              <span className="text-xs text-red-300 mt-0.5">for a specific fertilizer producer company</span>
            </div>
          </Link>
          <Link 
            href="/distribution" 
            className={`flex items-center px-4 py-2.5 text-gray-900 dark:text-white rounded-md font-medium transition-colors ${
              pathname === '/distribution' 
                ? 'bg-blue-50 dark:bg-blue-900' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <div className="flex flex-col">
              <span>Distribution</span>
              <span className="text-xs text-red-300 mt-0.5">only for CircuFert management</span>
            </div>
          </Link>
        </nav>
      </div>
    </aside>
  );
} 