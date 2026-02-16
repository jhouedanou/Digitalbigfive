"use client";

import { useEffect, useState } from "react";
import { BookOpen, Download, Wifi, WifiOff, Search, Grid, List, Trash2, RefreshCw, Cloud, HardDrive, Settings, LogOut } from "lucide-react";
import { getAllPDFMetadata, deletePDF, cleanupExpiredPDFs, getStorageInfo, type PDFMetadata } from "@/lib/offline-storage";

interface LibraryBook extends PDFMetadata {
  progress?: number;
  lastReadPage?: number;
  totalPages?: number;
}

export default function LibraryPage() {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [storageInfo, setStorageInfo] = useState({ totalPDFs: 0, totalSize: 0, availableSpace: 0 });
  const [showSettings, setShowSettings] = useState(false);

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
    loadStorageInfo();
    
    // Cleanup expired PDFs on load
    cleanupExpiredPDFs().then((count) => {
      if (count > 0) {
        loadBooks();
      }
    });
  }, []);

  async function loadBooks() {
    try {
      setLoading(true);
      const metadata = await getAllPDFMetadata();
      
      // Get reading progress from localStorage
      const libraryBooks: LibraryBook[] = metadata.map((pdf) => {
        const progress = localStorage.getItem(`reading_progress_${pdf.id}`);
        const progressData = progress ? JSON.parse(progress) : {};
        
        return {
          ...pdf,
          lastReadPage: progressData.page,
          totalPages: progressData.totalPages,
          progress: progressData.page && progressData.totalPages 
            ? Math.round((progressData.page / progressData.totalPages) * 100) 
            : 0,
        };
      });
      
      // Sort by download date, most recent first
      libraryBooks.sort((a, b) => b.downloadedAt - a.downloadedAt);
      
      setBooks(libraryBooks);
    } catch (error) {
      console.error("Error loading books:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadStorageInfo() {
    const info = await getStorageInfo();
    setStorageInfo(info);
  }

  // Sync with server when online
  async function syncWithServer() {
    if (!isOnline) return;
    
    setSyncing(true);
    try {
      // Fetch user's purchased products
      const response = await fetch("/api/profile/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      
      const data = await response.json();
      const products = data.products || [];
      
      // Get existing offline PDFs
      const existingPDFs = await getAllPDFMetadata();
      const existingIds = new Set(existingPDFs.map(p => p.id));
      
      let newDownloads = 0;
      
      // Download new PDFs
      for (const product of products) {
        if (!existingIds.has(product.id) && product.fileUrl) {
          try {
            // Download and store PDF
            await downloadAndStorePDF(product.id, product.title, product.thumbnail);
            newDownloads++;
          } catch (error) {
            console.error(`Failed to download PDF ${product.id}:`, error);
          }
        }
      }
      
      if (newDownloads > 0) {
        await loadBooks();
        await loadStorageInfo();
      }
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setSyncing(false);
    }
  }

  async function downloadAndStorePDF(resourceId: string, title: string, coverUrl?: string) {
    // Prepare PDF for offline using existing API
    const response = await fetch("/api/pdf/prepare-offline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resourceId }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to prepare PDF");
    }
    
    // The API already stores the PDF in IndexedDB
    console.log(`Downloaded: ${title}`);
  }

  // Delete a book
  async function handleDeleteBook(resourceId: string) {
    if (confirm("Supprimer ce livre de votre bibliothèque locale ?")) {
      await deletePDF(resourceId);
      localStorage.removeItem(`reading_progress_${resourceId}`);
      await loadBooks();
      await loadStorageInfo();
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
  function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
    return new Date(timestamp).toLocaleDateString("fr-FR");
  }

  // Filter books
  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate active and expired books
  const activeBooks = filteredBooks.filter(b => !b.isExpired);
  const expiredBooks = filteredBooks.filter(b => b.isExpired);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10 safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#80368D] to-[#29358B] rounded-xl flex items-center justify-center shadow-lg">
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
                  <span>{storageInfo.totalPDFs} livre{storageInfo.totalPDFs > 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sync button */}
              <button
                onClick={syncWithServer}
                disabled={!isOnline || syncing}
                className="p-2 hover:bg-white/10 rounded-lg transition disabled:opacity-50"
                title="Synchroniser avec le cloud"
              >
                <RefreshCw className={`w-5 h-5 text-white ${syncing ? "animate-spin" : ""}`} />
              </button>

              {/* Settings button */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Paramètres"
              >
                <Settings className="w-5 h-5 text-white" />
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
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-[#80368D] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Chargement de votre bibliothèque...</p>
          </div>
        ) : activeBooks.length === 0 && expiredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? "Aucun résultat" : "Bibliothèque vide"}
            </h2>
            <p className="text-gray-400 max-w-md mb-6">
              {searchQuery
                ? "Aucun livre ne correspond à votre recherche."
                : "Synchronisez votre bibliothèque pour télécharger vos livres et les lire hors ligne."}
            </p>
            {isOnline && !searchQuery && (
              <button
                onClick={syncWithServer}
                disabled={syncing}
                className="px-6 py-3 bg-gradient-to-r from-[#80368D] to-[#29358B] text-white rounded-xl font-medium hover:opacity-90 transition flex items-center gap-2"
              >
                <Cloud className="w-5 h-5" />
                Synchroniser mes achats
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Active books */}
            {activeBooks.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Disponibles hors ligne
                </h2>
                
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {activeBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        viewMode="grid"
                        onOpen={openBook}
                        onDelete={handleDeleteBook}
                        formatRelativeTime={formatRelativeTime}
                        formatSize={formatSize}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        viewMode="list"
                        onOpen={openBook}
                        onDelete={handleDeleteBook}
                        formatRelativeTime={formatRelativeTime}
                        formatSize={formatSize}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Expired books */}
            {expiredBooks.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-400 mb-4">
                  Expirés ({expiredBooks.length})
                </h2>
                <div className="opacity-50 space-y-2">
                  {expiredBooks.map((book) => (
                    <div
                      key={book.id}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-xl"
                    >
                      <div className="w-12 h-16 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-400 font-medium line-clamp-1">{book.title}</h3>
                        <p className="text-sm text-red-400">Accès expiré</p>
                      </div>
                      <button
                        onClick={() => handleDeleteBook(book.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Paramètres</h3>
            
            {/* Storage info */}
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Stockage utilisé</span>
                <span className="text-white font-medium">{formatSize(storageInfo.totalSize)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Livres téléchargés</span>
                <span className="text-white font-medium">{storageInfo.totalPDFs}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <a
                href="/dashboard/produits"
                className="flex items-center gap-3 w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl transition"
              >
                <Cloud className="w-5 h-5 text-gray-400" />
                <span className="text-white">Voir mes achats en ligne</span>
              </a>
              
              <button
                onClick={async () => {
                  if (confirm("Supprimer tous les livres téléchargés ?")) {
                    const metadata = await getAllPDFMetadata();
                    for (const pdf of metadata) {
                      await deletePDF(pdf.id);
                    }
                    await loadBooks();
                    await loadStorageInfo();
                    setShowSettings(false);
                  }
                }}
                className="flex items-center gap-3 w-full p-4 bg-white/5 hover:bg-red-500/20 rounded-xl transition text-left"
              >
                <Trash2 className="w-5 h-5 text-red-400" />
                <span className="text-red-400">Effacer tous les téléchargements</span>
              </button>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Bottom navigation for PWA */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-3">
          <button className="flex flex-col items-center gap-1 text-[#80368D]">
            <BookOpen className="w-6 h-6" />
            <span className="text-xs">Bibliothèque</span>
          </button>
          <button
            onClick={syncWithServer}
            disabled={!isOnline || syncing}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition disabled:opacity-50"
          >
            <Cloud className={`w-6 h-6 ${syncing ? "animate-pulse" : ""}`} />
            <span className="text-xs">Sync</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs">Paramètres</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// Book Card Component
function BookCard({
  book,
  viewMode,
  onOpen,
  onDelete,
  formatRelativeTime,
  formatSize,
}: {
  book: LibraryBook;
  viewMode: "grid" | "list";
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  formatRelativeTime: (timestamp: number) => string;
  formatSize: (bytes: number) => string;
}) {
  if (viewMode === "grid") {
    return (
      <div className="group relative">
        <button
          onClick={() => onOpen(book.id)}
          className="w-full aspect-[3/4] bg-gradient-to-br from-[#80368D]/20 to-[#29358B]/20 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#80368D] to-[#29358B]">
            <BookOpen className="w-8 h-8 text-white/80 mb-2" />
            <p className="text-white text-xs text-center line-clamp-3 font-medium">
              {book.title}
            </p>
          </div>
          
          {/* Progress indicator */}
          {book.progress && book.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div
                className="h-full bg-green-500"
                style={{ width: `${book.progress}%` }}
              />
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
            onDelete(book.id);
          }}
          className="absolute top-2 right-2 p-1.5 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      </div>
    );
  }

  // List view
  return (
    <button
      onClick={() => onOpen(book.id)}
      className="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition active:scale-[0.99]"
    >
      {/* Thumbnail */}
      <div className="w-16 h-20 bg-gradient-to-br from-[#80368D] to-[#29358B] rounded-lg flex items-center justify-center flex-shrink-0">
        <BookOpen className="w-6 h-6 text-white/80" />
      </div>

      {/* Info */}
      <div className="flex-1 text-left">
        <h3 className="text-white font-medium line-clamp-1">{book.title}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
          <span>{formatSize(book.fileSize)}</span>
          <span>•</span>
          <span>{formatRelativeTime(book.downloadedAt)}</span>
        </div>
        
        {/* Progress bar */}
        {book.progress && book.progress > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${book.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{book.progress}%</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(book.id);
        }}
        className="p-2 hover:bg-red-500/20 rounded-lg transition"
      >
        <Trash2 className="w-5 h-5 text-red-400" />
      </button>
    </button>
  );
}
