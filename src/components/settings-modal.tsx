"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Plus, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories");
      const body = await res.json();
      if (body.data) {
        setCategories(body.data);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    // Check if category name conflicts with default categories
    const defaults = newCatType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (defaults.some((c) => c.toLowerCase() === newCatName.trim().toLowerCase())) {
      setError("Bu isimde varsayılan bir kategori zaten mevcut.");
      setLoading(false);
      return;
    }

    // Check if category name conflicts with custom categories
    if (categories.some((c) => c.name.toLowerCase() === newCatName.trim().toLowerCase() && c.type === newCatType)) {
      setError("Bu isimde bir kategori zaten mevcut.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          type: newCatType,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Kategori eklenemedi.");
      }

      setSuccess("Kategori başarıyla eklendi.");
      setNewCatName("");
      fetchCategories();
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Kategori silinemedi.");
      }

      setSuccess("Kategori başarıyla silindi.");
      fetchCategories();
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:items-center px-0 md:px-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-card p-6 shadow-2xl transition-all duration-300 animate-slide-up md:rounded-2xl border border-border max-h-[85vh] flex flex-col">
        {/* Mobile handle */}
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted md:hidden" />

        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-primary animate-spin-slow" />
            <h3 className="text-lg font-bold text-foreground">Ayarlar</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-500 flex items-center gap-1.5">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-500">
            {success}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* Add Category Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Yeni Kategori Ekle</h4>
            <form onSubmit={handleAddCategory} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Kategori Adı"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="!py-2"
                />
                <Select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  options={[
                    { value: "expense", label: "Gider Kategorisi" },
                    { value: "income", label: "Gelir Kategorisi" },
                  ]}
                  className="!py-2"
                />
              </div>
              <Button type="submit" size="sm" className="w-full flex gap-1 items-center" disabled={loading}>
                <Plus size={16} />
                {loading ? "Ekleniyor..." : "Kategori Ekle"}
              </Button>
            </form>
          </div>

          {/* List Categories Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground border-b border-border/50 pb-2">
              Kategorilerim
            </h4>

            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Henüz özel bir kategori oluşturmadınız. (Varsayılan kategoriler otomatik listelenir.)
              </p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-xl bg-muted/40 border border-border/30 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-medium text-foreground">{cat.name}</span>
                      <span
                        className={`text-[10px] rounded px-1.5 py-0.5 font-semibold ${
                          cat.type === "income"
                            ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-500 dark:bg-rose-500/20"
                        }`}
                      >
                        {cat.type === "income" ? "Gelir" : "Gider"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-muted-foreground hover:text-red-500 p-1 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
