"use client";

import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="bg-card shadow-md sticky top-0 z-50 py-3 border-b-3 border-black">
      <div className="container mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
        <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold neu-brutal-header bg-newsmania-yellow text-black">
            NewsMania
          </h1>
        </Link>
      </div>
    </header>
  );
}
