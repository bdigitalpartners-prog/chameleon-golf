"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trash2,
  Edit2,
  Search,
  X,
} from "lucide-react";

function getAdminKey() {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem("golfEQ_admin_key") || "";
}

interface BookItem {
  id: number;
  title: string;
  subtitle: string | null;
  authors: string[];
  isbn: string | null;
  publisher: string | null;
  yearPublished: number | null;
  coverImageUrl: string | null;
  description: string | null;
  amazonUrl: string | null;
  bookshopUrl: string | null;
  tags: string[];
  isFeatured: boolean;
  architects: { architect: { id: number; name: string } }[];
  courses: { course: { courseId: number; courseName: string } }[];
}

interface ArchitectOption {
  id: number;
  name: string;
}

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  authors: [] as string[],
  isbn: "",
  publisher: "",
  yearPublished: "" as string | number,
  coverImageUrl: "",
  description: "",
  amazonUrl: "",
  bookshopUrl: "",
  tags: [] as string[],
  isFeatured: false,
  architectIds: [] as number[],
  courseIds: [] as number[],
};

export default function AdminBooksPage() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [authorsInput, setAuthorsInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [architectOptions, setArchitectOptions] = useState<ArchitectOption[]>([]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/books?${params}`, {
        headers: { "x-admin-key": getAdminKey() },
      });
      const data = await res.json();
      setBooks(data.books || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  useEffect(() => {
    fetch("/api/architects?suggest=true&limit=200")
      .then((r) => r.json())
      .then((data) => setArchitectOptions(data))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setAuthorsInput("");
    setTagsInput("");
    setShowForm(true);
  };

  const openEdit = (book: BookItem) => {
    setEditingId(book.id);
    setForm({
      title: book.title,
      subtitle: book.subtitle || "",
      authors: book.authors,
      isbn: book.isbn || "",
      publisher: book.publisher || "",
      yearPublished: book.yearPublished || "",
      coverImageUrl: book.coverImageUrl || "",
      description: book.description || "",
      amazonUrl: book.amazonUrl || "",
      bookshopUrl: book.bookshopUrl || "",
      tags: book.tags,
      isFeatured: book.isFeatured,
      architectIds: book.architects.map((a) => a.architect.id),
      courseIds: book.courses.map((c) => c.course.courseId),
    });
    setAuthorsInput(book.authors.join(", "));
    setTagsInput(book.tags.join(", "));
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      authors: authorsInput.split(",").map((s) => s.trim()).filter(Boolean),
      tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
      yearPublished: form.yearPublished ? parseInt(String(form.yearPublished)) : null,
    };

    if (editingId) {
      await fetch(`/api/admin/books`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
        body: JSON.stringify({ id: editingId, ...payload }),
      });
    } else {
      await fetch(`/api/admin/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": getAdminKey() },
        body: JSON.stringify(payload),
      });
    }
    setShowForm(false);
    fetchBooks();
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/admin/books?id=${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": getAdminKey() },
    });
    fetchBooks();
  };

  const toggleArchitect = (id: number) => {
    setForm((f) => ({
      ...f,
      architectIds: f.architectIds.includes(id)
        ? f.architectIds.filter((a) => a !== id)
        : [...f.architectIds, id],
    }));
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white text-sm focus:outline-none focus:border-[#22c55e]";
  const labelClass = "block text-xs text-gray-400 mb-1";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen size={24} className="text-[#22c55e]" />
            Book Manager
          </h1>
          <p className="text-sm text-gray-400 mt-1">{total} books</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-black font-medium hover:bg-[#16a34a] transition-colors"
        >
          <Plus size={16} />
          Add Book
        </button>
      </div>

      {/* Search */}
      <div className="max-w-md relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search books..."
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#22c55e]"
        />
      </div>

      {/* Form Dialog */}
      {showForm && (
        <div className="bg-[#111] border border-[#222] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">{editingId ? "Edit Book" : "Add Book"}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Subtitle</label>
              <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Authors (comma-separated)</label>
              <input type="text" value={authorsInput} onChange={(e) => setAuthorsInput(e.target.value)} className={inputClass} placeholder="Author One, Author Two" />
            </div>
            <div>
              <label className={labelClass}>ISBN</label>
              <input type="text" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Publisher</label>
              <input type="text" value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Year Published</label>
              <input type="number" value={form.yearPublished} onChange={(e) => setForm({ ...form, yearPublished: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Cover Image URL</label>
              <input type="url" value={form.coverImageUrl} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Amazon URL</label>
              <input type="url" value={form.amazonUrl} onChange={(e) => setForm({ ...form, amazonUrl: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bookshop URL</label>
              <input type="url" value={form.bookshopUrl} onChange={(e) => setForm({ ...form, bookshopUrl: e.target.value })} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Tags (comma-separated)</label>
              <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className={inputClass} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="accent-[#22c55e]" />
              <label className="text-sm text-gray-400">Featured</label>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Linked Architects</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {architectOptions.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => toggleArchitect(a.id)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      form.architectIds.includes(a.id)
                        ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/50"
                        : "bg-[#1a1a1a] text-gray-400 border border-[#333]"
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-[#22c55e] text-black font-medium text-sm">
              {editingId ? "Update" : "Create"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-[#333] text-gray-400 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Book List */}
      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-gray-500" size={32} />
          </div>
        ) : books.length === 0 ? (
          <div className="py-12 text-center text-gray-500">No books found</div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {books.map((book) => (
              <div key={book.id} className="p-4 hover:bg-[#1a1a1a] transition-colors flex items-start gap-4">
                {book.coverImageUrl ? (
                  <img src={book.coverImageUrl} alt="" className="w-12 h-16 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-16 rounded bg-[#222] flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-gray-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium text-sm">{book.title}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {book.authors.join(", ")}
                    {book.yearPublished && ` (${book.yearPublished})`}
                    {book.publisher && ` · ${book.publisher}`}
                  </p>
                  {book.architects.length > 0 && (
                    <p className="text-[#22c55e] text-xs mt-1">
                      {book.architects.map((a) => a.architect.name).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {book.isFeatured && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-900/40 text-yellow-400">Featured</span>
                  )}
                  <button onClick={() => openEdit(book)} className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 hover:text-white">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(book.id, book.title)} className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 hover:bg-red-900/40 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#222]">
            <p className="text-xs text-gray-500">Page {page} of {totalPages} ({total} books)</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 disabled:opacity-30">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded bg-[#1a1a1a] border border-[#333] text-gray-400 disabled:opacity-30">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
