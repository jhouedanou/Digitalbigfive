"use client";

import { useState, useEffect } from "react";
import { BookOpen, Loader2, BookMarked, Search } from "lucide-react";
import { useAuth } from "@/components/providers/SessionProvider";
import Link from "next/link";
import Image from "next/image";
import DownloadAppButton from "@/components/pwa/DownloadAppButton";

interface Book {
  id: string;
  title: string;
  coverImage: string;
  shortDescription: string;
  category: string;
  pageCount: number | null;
  purchasedAt: string;
}

export default function BibliotequePage() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    try {
      setLoading(true);
      const res = await fetch("/api/profile/books", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error("Error loading books:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group books by category
  const categories = [...new Set(filteredBooks.map((b) => b.category))];

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-8 min-h-screen bg-[#1c1c1e]">
      {/* ═══ Top bar ═══ */}
      <div className="sticky top-0 z-20 bg-[#1c1c1e]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#FF9F0A]" />
              <h1 className="text-xl font-bold text-white">Bibliothèque</h1>
              {books.length > 0 && (
                <span className="text-sm text-gray-500">{books.length} livre{books.length > 1 ? "s" : ""}</span>
              )}
            </div>

            {/* Search */}
            {books.length > 0 && (
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-9 pr-4 py-2 bg-white/10 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF9F0A]/50"
                />
              </div>
            )}

            {/* Download / Install App button */}
            <DownloadAppButton variant="compact" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Download App / PWA banner */}
        <div className="mb-6">
          <DownloadAppButton variant="banner" />
        </div>

        {loading ? (
          /* ═══ Loading ═══ */
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 text-[#FF9F0A] animate-spin" />
            <p className="text-gray-500">Chargement de votre bibliothèque...</p>
          </div>
        ) : books.length === 0 ? (
          /* ═══ Empty state ═══ */
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-[#FF9F0A]/20 to-[#FF6B00]/20 rounded-3xl flex items-center justify-center mb-6">
              <BookMarked className="w-12 h-12 text-[#FF9F0A]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Votre bibliothèque est vide</h2>
            <p className="text-gray-500 mb-8 max-w-md">
              Vos livres achetés apparaîtront ici. Découvrez nos ressources pour commencer votre collection.
            </p>
            <Link
              href="/produits"
              className="px-6 py-3 bg-[#FF9F0A] text-black font-semibold rounded-xl hover:bg-[#FFB340] transition"
            >
              Découvrir les produits
            </Link>
          </div>
        ) : (
          /* ═══ Book shelves ═══ */
          <div className="space-y-10">
            {/* If search active, show flat grid */}
            {searchQuery ? (
              <BookShelf title={`Résultats (${filteredBooks.length})`} books={filteredBooks} />
            ) : (
              <>
                {/* "Récents" — all books sorted by purchase date */}
                {books.length > 0 && (
                  <BookShelf title="Récents" books={books.slice(0, 8)} />
                )}

                {/* By category */}
                {categories.map((category) => (
                  <BookShelf
                    key={category}
                    title={category}
                    books={filteredBooks.filter((b) => b.category === category)}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ═══ iBooks shelf styling ═══ */}
      <style jsx global>{`
        .book-cover {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          transform-style: preserve-3d;
        }
        .book-cover:hover {
          transform: scale(1.05) translateY(-8px);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1);
        }
        .book-spine {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(to right, rgba(0,0,0,0.3), rgba(0,0,0,0.1), rgba(255,255,255,0.05));
          border-radius: 2px 0 0 2px;
          z-index: 2;
        }
        .shelf-wood {
          background: linear-gradient(180deg, 
            #5c3d2e 0%, 
            #8b6914 8%, 
            #a0824a 12%,
            #7a5a30 18%,
            #6b4423 30%, 
            #5c3d2e 100%
          );
          box-shadow: 
            0 2px 8px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}

/* ═══ Book Shelf Component ═══ */
function BookShelf({ title, books }: { title: string; books: Book[] }) {
  if (books.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-300 mb-4 px-1">{title}</h2>

      {/* Books row */}
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-2 pb-1">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>

        {/* Wooden shelf */}
        <div className="shelf-wood h-3 rounded-sm -mt-1 relative z-0" />
        <div className="h-2 bg-gradient-to-b from-black/20 to-transparent" />
      </div>
    </div>
  );
}

/* ═══ Book Card Component ═══ */
function BookCard({ book }: { book: Book }) {
  return (
    <Link
      href={`/dashboard/reader/${book.id}`}
      className="group flex flex-col items-center"
    >
      {/* Book cover with 3D effect */}
      <div className="book-cover relative rounded-sm overflow-hidden shadow-lg cursor-pointer"
        style={{ width: "140px", height: "200px" }}
      >
        {/* Spine effect */}
        <div className="book-spine" />

        {/* Cover image */}
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover"
            sizes="140px"
          />
        ) : (
          /* Fallback cover */
          <div className="w-full h-full bg-gradient-to-br from-[#80368D] to-[#29358B] flex flex-col items-center justify-center p-3 text-center">
            <BookOpen className="w-8 h-8 text-white/60 mb-2" />
            <span className="text-white/90 text-xs font-medium leading-tight line-clamp-3">
              {book.title}
            </span>
          </div>
        )}

        {/* Glossy reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />

        {/* Page edge effect (right side) */}
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-l from-gray-300/30 to-transparent" />
      </div>

      {/* Title */}
      <div className="mt-2 w-[140px] text-center px-1">
        <p className="text-white text-xs font-medium line-clamp-2 leading-tight group-hover:text-[#FF9F0A] transition-colors">
          {book.title}
        </p>
        {book.pageCount && (
          <p className="text-gray-600 text-[10px] mt-0.5">{book.pageCount} pages</p>
        )}
      </div>
    </Link>
  );
}
