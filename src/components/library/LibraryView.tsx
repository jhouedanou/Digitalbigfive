"use client";

import { useState, useEffect } from "react";
import { BookOpen, Download, Wifi, WifiOff, Search, Grid, List, Trash2, RefreshCw } from "lucide-react";
import { offlineStorage, OfflinePDF } from "@/lib/offline-storage";

interface LibraryBook {
  id: string;
  resourceId: string;
  title: string;
  coverUrl?: string;
  downloadedAt: Date;
  expiresAt: Date;
  fileSize: number;
  lastReadPage?: number;
  totalPages?: number;
  isExpired: boolean;
}

export default function LibraryView() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  // Check online status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load books from IndexedDB
  useEffect(() => {
    loadBooks();
  }, []);

  async function loadBooks() {
    try {
      setLoading(true);
      const pdfs = await offlineStorage.getAllPDFs();
      
      const libraryBooks: LibraryBook[] = pdfs.map((pdf) => ({
        id: pdf.id,
        resourceId: pdf.resourceId,
        title: pdf.title,
        coverUrl: pdf.coverUrl,
        downloadedAt: new Date(pdf.downloadedAt),
        expiresAt: new Date(pdf.expiresAt),
        fileSize: pdf.encryptedData.byteLength,
        lastReadPage: pdf.lastReadPage,
        totalPages: pdf.totalPages,
        isExpired: Date.now() > pdf.expiresAt,
      }));
      
      // Sort by download date, most recent first
      libraryBooks.sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime());
      
      setBooks(libraryBooks);
    } catch (error) {
      console.error("Error loading books:", error);
    } finally {
      setLoading(false);
    }
  }

  // Sync with server when online
  async function syncWithServer() {
    if (!isOnline) return;
    
    setSyncing(true);
    try {
      await offlineStorage.syncWithServer();
      await loadBooks();
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  }

  // Delete a book
  async function deleteBook(resourceId: string) {
    if (confirm("Supprimer ce livre de votre bibliothèque ?")) {
      await offlineStorage.deletePDF(resourceId);
      await loadBooks();
    }
  }

  // Open book reader
  function openBook(resourceId: string) {
    window.location.href = `/library/reader/${resourceId}`;
  }

  // Format file size
  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Format relative time
  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return date.toLocaleDateString("fr-FR");
  }

  // Filter books
  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#80368D] to-[#29358B] rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Ma Bibliothèque</h1>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 text-green-500" />
                      <span>En ligne</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-orange-500" />
                      <span>Hors ligne</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{books.length} livre{books.length > 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sync button */}
              <button
                onClick={syncWithServer}
                disabled={!isOnline || syncing}
                className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50"
                title="Synchroniser"
              >
                <RefreshCw className={`w-5 h-5 text-white ${syncing ? "animate-spin" : ""}`} />
              </button>

              {/* View mode toggle */}
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${viewMode === "grid" ? "bg-white/20" : ""}`}
                >
                  <Grid className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-white/20" : ""}`}
                >
                  <List className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans votre bibliothèque..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#80368D]/50"
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#80368D] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Chargement de votre bibliothèque...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? "Aucun résultat" : "Bibliothèque vide"}
            </h2>
            <p className="text-gray-400 max-w-md">
              {searchQuery
                ? "Aucun livre ne correspond à votre recherche."
                : "Téléchargez vos livres depuis le site pour les lire hors ligne."}
            </p>
            {isOnline && !searchQuery && (
              <a
                href="/dashboard/produits"
                className="mt-6 px-6 py-3 bg-gradient-to-r from-[#80368D] to-[#29358B] text-white rounded-xl font-medium hover:opacity-90 transition"
              >
                Voir mes achats
              </a>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View - iBooks style */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                className={`group relative ${book.isExpired ? "opacity-50" : ""}`}
              >
                {/* Book cover */}
                <button
                  onClick={() => !book.isExpired && openBook(book.resourceId)}
                  disabled={book.isExpired}
                  className="w-full aspect-[3/4] bg-gradient-to-br from-[#80368D]/20 to-[#29358B]/20 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#80368D] to-[#29358B]">
                      <BookOpen className="w-8 h-8 text-white/80 mb-2" />
                      <p className="text-white text-xs text-center line-clamp-3 font-medium">
                        {book.title}
                      </p>
                    </div>
                  )}
                  
                  {/* Progress indicator */}
                  {book.lastReadPage && book.totalPages && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                      <div
                        className="h-full bg-[#80368D]"
                        style={{ width: `${(book.lastReadPage / book.totalPages) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* Expired badge */}
                  {book.isExpired && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-red-400 text-sm font-medium">Expiré</span>
                    </div>
                  )}
                </button>

                {/* Book info */}
                <div className="mt-2 px-1">
                  <h3 className="text-white text-sm font-medium line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {formatRelativeTime(book.downloadedAt)}
                  </p>
                </div>

                {/* Delete button (on hover) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBook(book.resourceId);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredBooks.map((book) => (
              <button
                key={book.id}
                onClick={() => !book.isExpired && openBook(book.resourceId)}
                disabled={book.isExpired}
                className={`w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition ${
                  book.isExpired ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {/* Thumbnail */}
                <div className="w-16 h-20 bg-gradient-to-br from-[#80368D] to-[#29358B] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-white/80" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <h3 className="text-white font-medium line-clamp-1">{book.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                    <span>{formatSize(book.fileSize)}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(book.downloadedAt)}</span>
                    {book.isExpired && (
                      <>
                        <span>•</span>
                        <span className="text-red-400">Expiré</span>
                      </>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  {book.lastReadPage && book.totalPages && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#80368D]"
                          style={{ width: `${(book.lastReadPage / book.totalPages) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round((book.lastReadPage / book.totalPages) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBook(book.resourceId);
                  }}
                  className="p-2 hover:bg-red-500/20 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Bottom safe area for mobile */}
      <div className="h-20" />
    </div>
  );
}
