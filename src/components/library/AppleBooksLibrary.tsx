"use client";

import { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Download,
  Wifi,
  WifiOff,
  Search,
  Grid3X3,
  List,
  Trash2,
  RefreshCw,
  Cloud,
  HardDrive,
  Settings,
  ChevronRight,
  Play,
  MoreHorizontal,
  X,
  Check,
  Clock,
  CloudDownload,
} from "lucide-react";
import {
  getAllPDFMetadata,
  deletePDF,
  cleanupExpiredPDFs,
  getStorageInfo,
  type PDFMetadata,
} from "@/lib/offline-storage";

// ─── Types ──────────────────────────────────────────────────

interface LibraryBook {
  id: string;
  title: string;
  author?: string;
  coverImage?: string;
  downloadedAt: number;
  expiresAt: number;
  fileSize: number;
  progress: number;
  lastReadPage?: number;
  totalPages?: number;
  isExpired: boolean;
  isDownloaded: boolean;
  isDownloading?: boolean;
}

interface AppleBooksLibraryProps {
  userId: string;
  onOpenReader: (bookId: string) => void;
}

// ─── Composant Principal ────────────────────────────────────

export default function AppleBooksLibrary({
  userId,
  onOpenReader,
}: AppleBooksLibraryProps) {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<"shelf" | "grid" | "list">("shelf");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [storageInfo, setStorageInfo] = useState({
    totalPDFs: 0,
    totalSize: 0,
    availableSpace: 0,
  });

  // ─── Effects ──────────────────────────────────────────────

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

  useEffect(() => {
    loadBooks();
    cleanupExpiredPDFs();
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncWithServer();
    }
  }, [isOnline]);

  // ─── Data Loading ─────────────────────────────────────────

  async function loadBooks() {
    setLoading(true);
    try {
      // Get local PDFs
      const localPDFs = await getAllPDFMetadata();
      const info = await getStorageInfo();
      setStorageInfo(info);

      // Fetch purchased products from server
      let serverProducts: any[] = [];
      if (isOnline) {
        try {
          const response = await fetch("/api/library/sync");
          if (response.ok) {
            const data = await response.json();
            serverProducts = data.products || [];
          }
        } catch (error) {
          console.error("Failed to fetch server products:", error);
        }
      }

      // Merge local and server data
      const localIds = new Set(localPDFs.map((p) => p.id));
      const mergedBooks: LibraryBook[] = [];

      // Add server products
      for (const product of serverProducts) {
        const localPDF = localPDFs.find((p) => p.id === product.id);
        const progress = getReadingProgress(product.id);

        mergedBooks.push({
          id: product.id,
          title: product.title,
          author: product.author || "Digital Big Five",
          coverImage: product.coverImage,
          downloadedAt: localPDF?.downloadedAt || 0,
          expiresAt: localPDF?.expiresAt || 0,
          fileSize: localPDF?.fileSize || product.fileSize || 0,
          progress: progress.percent,
          lastReadPage: progress.page,
          totalPages: progress.totalPages,
          isExpired: localPDF?.isExpired || false,
          isDownloaded: localIds.has(product.id) && !localPDF?.isExpired,
          isDownloading: false,
        });
      }

      // Add any local PDFs not in server (shouldn't happen normally)
      for (const localPDF of localPDFs) {
        if (!serverProducts.find((p: any) => p.id === localPDF.id)) {
          const progress = getReadingProgress(localPDF.id);
          mergedBooks.push({
            id: localPDF.id,
            title: localPDF.title,
            author: "Digital Big Five",
            coverImage: undefined,
            downloadedAt: localPDF.downloadedAt,
            expiresAt: localPDF.expiresAt,
            fileSize: localPDF.fileSize,
            progress: progress.percent,
            lastReadPage: progress.page,
            totalPages: progress.totalPages,
            isExpired: localPDF.isExpired,
            isDownloaded: !localPDF.isExpired,
            isDownloading: false,
          });
        }
      }

      // Sort: most recent first
      mergedBooks.sort((a, b) => {
        if (a.progress > 0 && b.progress === 0) return -1;
        if (a.progress === 0 && b.progress > 0) return 1;
        return b.downloadedAt - a.downloadedAt;
      });

      setBooks(mergedBooks);
    } catch (error) {
      console.error("Error loading books:", error);
    } finally {
      setLoading(false);
    }
  }

  function getReadingProgress(bookId: string): {
    page: number;
    totalPages: number;
    percent: number;
  } {
    try {
      const progress = localStorage.getItem(`reading_progress_${bookId}`);
      if (progress) {
        const data = JSON.parse(progress);
        return {
          page: data.page || 0,
          totalPages: data.totalPages || 0,
          percent:
            data.page && data.totalPages
              ? Math.round((data.page / data.totalPages) * 100)
              : 0,
        };
      }
    } catch (error) {
      console.error("Error reading progress:", error);
    }
    return { page: 0, totalPages: 0, percent: 0 };
  }

  async function syncWithServer() {
    if (!isOnline || syncing) return;

    setSyncing(true);
    try {
      await loadBooks();
    } finally {
      setSyncing(false);
    }
  }

  // ─── Actions ──────────────────────────────────────────────

  async function handleDownloadBook(bookId: string) {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, isDownloading: true } : b))
    );

    try {
      const response = await fetch("/api/pdf/prepare-offline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId: bookId }),
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      await loadBooks();
    } catch (error) {
      console.error("Download error:", error);
      alert("Erreur lors du téléchargement. Veuillez réessayer.");
    } finally {
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, isDownloading: false } : b))
      );
    }
  }

  async function handleDeleteBook(bookId: string) {
    if (confirm("Supprimer ce livre de votre appareil ?")) {
      await deletePDF(bookId);
      localStorage.removeItem(`reading_progress_${bookId}`);
      await loadBooks();
      setSelectedBook(null);
      setShowContextMenu(false);
    }
  }

  function handleOpenBook(book: LibraryBook) {
    if (book.isDownloaded) {
      onOpenReader(book.id);
    } else if (isOnline) {
      handleDownloadBook(book.id);
    } else {
      alert("Ce livre n'est pas disponible hors ligne. Connectez-vous pour le télécharger.");
    }
  }

  function handleContextMenu(e: React.MouseEvent, book: LibraryBook) {
    e.preventDefault();
    setSelectedBook(book);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }

  // ─── Filtering ────────────────────────────────────────────

  const filteredBooks = books.filter((book) =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentlyReading = filteredBooks.filter(
    (b) => b.progress > 0 && b.progress < 100
  );
  const newBooks = filteredBooks.filter((b) => b.progress === 0);
  const completedBooks = filteredBooks.filter((b) => b.progress === 100);

  // ─── Helpers ──────────────────────────────────────────────

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-white overflow-x-hidden">
      {/* Header - Apple Style */}
      <header className="sticky top-0 z-50 bg-[#1c1c1e]/90 backdrop-blur-xl border-b border-white/10 safe-area-inset-top">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                Bibliothèque
              </h1>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  isOnline
                    ? "bg-green-500/20 text-green-400"
                    : "bg-orange-500/20 text-orange-400"
                }`}
              >
                {isOnline ? (
                  <Wifi className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                {isOnline ? "En ligne" : "Hors ligne"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-white/10 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("shelf")}
                  className={`p-2 rounded-md transition ${
                    viewMode === "shelf" ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                  title="Vue étagère"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition ${
                    viewMode === "grid" ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                  title="Vue grille"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition ${
                    viewMode === "list" ? "bg-white/20" : "hover:bg-white/10"
                  }`}
                  title="Vue liste"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Sync Button */}
              <button
                onClick={syncWithServer}
                disabled={!isOnline || syncing}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition disabled:opacity-50"
                title="Synchroniser"
              >
                <RefreshCw
                  className={`w-5 h-5 ${syncing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search */}
      <div className="sm:hidden px-4 py-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            <p className="text-gray-400">Chargement de votre bibliothèque...</p>
          </div>
        </div>
      ) : books.length === 0 ? (
        <EmptyLibrary isOnline={isOnline} />
      ) : viewMode === "shelf" ? (
        <ShelfView
          currentlyReading={currentlyReading}
          newBooks={newBooks}
          completedBooks={completedBooks}
          onOpenBook={handleOpenBook}
          onDownloadBook={handleDownloadBook}
          onContextMenu={handleContextMenu}
          isOnline={isOnline}
        />
      ) : viewMode === "grid" ? (
        <GridView
          books={filteredBooks}
          onOpenBook={handleOpenBook}
          onDownloadBook={handleDownloadBook}
          onContextMenu={handleContextMenu}
          isOnline={isOnline}
        />
      ) : (
        <ListView
          books={filteredBooks}
          onOpenBook={handleOpenBook}
          onDownloadBook={handleDownloadBook}
          onDeleteBook={handleDeleteBook}
          isOnline={isOnline}
        />
      )}

      {/* Context Menu */}
      {showContextMenu && selectedBook && (
        <ContextMenu
          book={selectedBook}
          position={contextMenuPosition}
          onClose={() => setShowContextMenu(false)}
          onOpen={() => {
            handleOpenBook(selectedBook);
            setShowContextMenu(false);
          }}
          onDownload={() => {
            handleDownloadBook(selectedBook.id);
            setShowContextMenu(false);
          }}
          onDelete={() => handleDeleteBook(selectedBook.id)}
          isOnline={isOnline}
        />
      )}
    </div>
  );
}

// ─── Sub Components ─────────────────────────────────────────

function EmptyLibrary({ isOnline }: { isOnline: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6">
        <BookOpen className="w-12 h-12 text-orange-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">
        Votre bibliothèque est vide
      </h2>
      <p className="text-gray-400 max-w-sm mb-6">
        {isOnline
          ? "Achetez des livres pour les retrouver ici et les lire en ligne ou hors connexion."
          : "Connectez-vous à internet pour synchroniser vos achats."}
      </p>
      {isOnline && (
        <a
          href="/produits"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-xl font-medium text-white hover:opacity-90 transition"
        >
          Découvrir les livres
          <ChevronRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}

function ShelfView({
  currentlyReading,
  newBooks,
  completedBooks,
  onOpenBook,
  onDownloadBook,
  onContextMenu,
  isOnline,
}: {
  currentlyReading: LibraryBook[];
  newBooks: LibraryBook[];
  completedBooks: LibraryBook[];
  onOpenBook: (book: LibraryBook) => void;
  onDownloadBook: (bookId: string) => void;
  onContextMenu: (e: React.MouseEvent, book: LibraryBook) => void;
  isOnline: boolean;
}) {
  return (
    <div className="pb-20">
      {/* Currently Reading */}
      {currentlyReading.length > 0 && (
        <BookShelf
          title="En cours de lecture"
          books={currentlyReading}
          onOpenBook={onOpenBook}
          onDownloadBook={onDownloadBook}
          onContextMenu={onContextMenu}
          isOnline={isOnline}
          showProgress
        />
      )}

      {/* New Books */}
      {newBooks.length > 0 && (
        <BookShelf
          title="Récemment ajoutés"
          books={newBooks}
          onOpenBook={onOpenBook}
          onDownloadBook={onDownloadBook}
          onContextMenu={onContextMenu}
          isOnline={isOnline}
        />
      )}

      {/* Completed */}
      {completedBooks.length > 0 && (
        <BookShelf
          title="Terminés"
          books={completedBooks}
          onOpenBook={onOpenBook}
          onDownloadBook={onDownloadBook}
          onContextMenu={onContextMenu}
          isOnline={isOnline}
        />
      )}
    </div>
  );
}

function BookShelf({
  title,
  books,
  onOpenBook,
  onDownloadBook,
  onContextMenu,
  isOnline,
  showProgress = false,
}: {
  title: string;
  books: LibraryBook[];
  onOpenBook: (book: LibraryBook) => void;
  onDownloadBook: (bookId: string) => void;
  onContextMenu: (e: React.MouseEvent, book: LibraryBook) => void;
  isOnline: boolean;
  showProgress?: boolean;
}) {
  return (
    <section className="mb-8">
      <div className="px-4 mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>

      {/* Wooden Shelf Effect */}
      <div className="relative">
        {/* Books Container */}
        <div className="overflow-x-auto scrollbar-hide px-4">
          <div className="flex gap-4 pb-4">
            {books.map((book) => (
              <BookCover3D
                key={book.id}
                book={book}
                onOpen={() => onOpenBook(book)}
                onDownload={() => onDownloadBook(book.id)}
                onContextMenu={(e) => onContextMenu(e, book)}
                isOnline={isOnline}
                showProgress={showProgress}
              />
            ))}
          </div>
        </div>

        {/* Wooden Shelf */}
        <div
          className="h-4 bg-gradient-to-b from-[#8B4513] via-[#A0522D] to-[#654321] rounded-sm shadow-lg"
          style={{
            boxShadow:
              "0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="h-1 bg-gradient-to-r from-transparent via-[#DEB887]/30 to-transparent" />
        </div>
        <div
          className="h-2 bg-gradient-to-b from-[#654321] to-[#3E2723] shadow-lg"
          style={{
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.4)",
          }}
        />
      </div>
    </section>
  );
}

function BookCover3D({
  book,
  onOpen,
  onDownload,
  onContextMenu,
  isOnline,
  showProgress,
}: {
  book: LibraryBook;
  onOpen: () => void;
  onDownload: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  isOnline: boolean;
  showProgress?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const canOpen = book.isDownloaded || isOnline;

  return (
    <div
      className="relative flex-shrink-0 group cursor-pointer"
      style={{ perspective: "1000px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={onContextMenu}
    >
      {/* Book Container with 3D Effect */}
      <div
        className="relative transition-transform duration-300 ease-out"
        style={{
          width: "140px",
          height: "200px",
          transformStyle: "preserve-3d",
          transform: isHovered
            ? "rotateY(-15deg) translateZ(20px)"
            : "rotateY(0deg)",
        }}
        onClick={() => (canOpen ? onOpen() : onDownload())}
      >
        {/* Front Cover */}
        <div
          className="absolute inset-0 rounded-r-sm overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            boxShadow: isHovered
              ? "10px 10px 20px rgba(0, 0, 0, 0.5)"
              : "4px 4px 8px rgba(0, 0, 0, 0.3)",
            transition: "box-shadow 0.3s ease",
          }}
        >
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-600 to-pink-600 flex items-center justify-center p-4">
              <span className="text-white text-sm font-medium text-center line-clamp-4">
                {book.title}
              </span>
            </div>
          )}

          {/* Downloading Overlay */}
          {book.isDownloading && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Download Badge */}
          {!book.isDownloaded && !book.isDownloading && (
            <div className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
              <CloudDownload className="w-4 h-4 text-gray-700" />
            </div>
          )}

          {/* Downloaded Badge */}
          {book.isDownloaded && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}

          {/* Progress Bar */}
          {showProgress && book.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
                style={{ width: `${book.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Book Spine (Left Side) */}
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-gray-700 to-gray-600"
          style={{
            width: "10px",
            transform: "rotateY(90deg) translateZ(-5px)",
            transformOrigin: "left center",
          }}
        />

        {/* Book Pages (Right Side) */}
        <div
          className="absolute right-0 top-1 bottom-1"
          style={{
            width: "8px",
            background:
              "repeating-linear-gradient(to bottom, #f5f5dc 0px, #f5f5dc 1px, #e8e8d8 1px, #e8e8d8 2px)",
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>

      {/* Book Title (below) */}
      <div className="mt-2 w-36">
        <h3 className="text-sm font-medium text-white truncate">{book.title}</h3>
        {book.author && (
          <p className="text-xs text-gray-400 truncate">{book.author}</p>
        )}
        {showProgress && book.progress > 0 && (
          <p className="text-xs text-orange-400 mt-1">{book.progress}% lu</p>
        )}
      </div>
    </div>
  );
}

function GridView({
  books,
  onOpenBook,
  onDownloadBook,
  onContextMenu,
  isOnline,
}: {
  books: LibraryBook[];
  onOpenBook: (book: LibraryBook) => void;
  onDownloadBook: (bookId: string) => void;
  onContextMenu: (e: React.MouseEvent, book: LibraryBook) => void;
  isOnline: boolean;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-20">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {books.map((book) => (
          <BookCover3D
            key={book.id}
            book={book}
            onOpen={() => onOpenBook(book)}
            onDownload={() => onDownloadBook(book.id)}
            onContextMenu={(e) => onContextMenu(e, book)}
            isOnline={isOnline}
            showProgress
          />
        ))}
      </div>
    </div>
  );
}

function ListView({
  books,
  onOpenBook,
  onDownloadBook,
  onDeleteBook,
  isOnline,
}: {
  books: LibraryBook[];
  onOpenBook: (book: LibraryBook) => void;
  onDownloadBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  isOnline: boolean;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
      <div className="space-y-2">
        {books.map((book) => (
          <div
            key={book.id}
            className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition cursor-pointer"
            onClick={() => onOpenBook(book)}
          >
            {/* Cover Thumbnail */}
            <div className="w-14 h-20 flex-shrink-0 rounded-sm overflow-hidden shadow-lg">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-600 to-pink-600" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">{book.title}</h3>
              <p className="text-sm text-gray-400 truncate">
                {book.author || "Digital Big Five"}
              </p>
              {book.progress > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
                      style={{ width: `${book.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{book.progress}%</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!book.isDownloaded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadBook(book.id);
                  }}
                  disabled={!isOnline || book.isDownloading}
                  className="p-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition disabled:opacity-50"
                >
                  {book.isDownloading ? (
                    <div className="w-4 h-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              )}
              {book.isDownloaded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBook(book.id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContextMenu({
  book,
  position,
  onClose,
  onOpen,
  onDownload,
  onDelete,
  isOnline,
}: {
  book: LibraryBook;
  position: { x: number; y: number };
  onClose: () => void;
  onOpen: () => void;
  onDownload: () => void;
  onDelete: () => void;
  isOnline: boolean;
}) {
  useEffect(() => {
    function handleClick() {
      onClose();
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  return (
    <div
      className="fixed z-50 bg-[#2c2c2e] rounded-xl shadow-2xl overflow-hidden min-w-[200px] border border-white/10"
      style={{
        left: Math.min(position.x, window.innerWidth - 220),
        top: Math.min(position.y, window.innerHeight - 200),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 border-b border-white/10">
        <p className="font-medium text-white truncate">{book.title}</p>
        <p className="text-xs text-gray-400">{book.author}</p>
      </div>

      <div className="py-1">
        {book.isDownloaded ? (
          <button
            onClick={onOpen}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
          >
            <Play className="w-4 h-4" />
            Lire
          </button>
        ) : (
          <button
            onClick={onDownload}
            disabled={!isOnline}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white hover:bg-white/10 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Télécharger
          </button>
        )}

        {book.isDownloaded && (
          <button
            onClick={onDelete}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-4 h-4" />
            Supprimer de l'appareil
          </button>
        )}
      </div>
    </div>
  );
}
