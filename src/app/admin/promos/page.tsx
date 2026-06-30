"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Tag, ImageIcon, Loader2, Eye, EyeOff, Search } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { getVouchers, createVoucher, updateVoucher, deleteVoucher } from "@/actions/vouchers";
import type { Voucher } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/image-upload";

export default function AdminPromosPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeListTab, setActiveListTab] = useState<"ticket" | "food">("ticket");

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    terms: "",
    price: "",
    code: "",
    is_active: true,
    expiry_date: "",
    usage_limit: "0",
    limit_per_user: "0",
    voucher_type: "ticket" as "ticket" | "food",
  });

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVouchers();
      setVouchers(data);
    } catch {
      toast.error("Failed to load promo codes / vouchers");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const openCreateModal = (type: "ticket" | "food") => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      image_url: "",
      terms: "",
      price: "",
      code: type === "food" 
        ? `FOOD-${Math.random().toString(36).substr(2, 5).toUpperCase()}` 
        : "",
      is_active: true,
      expiry_date: "",
      usage_limit: "0",
      limit_per_user: "0",
      voucher_type: type,
    });
    setShowModal(true);
  };

  const openEditModal = (voucher: Voucher) => {
    setEditing(voucher);
    setForm({
      title: voucher.title,
      description: voucher.description,
      image_url: voucher.image_url,
      terms: voucher.terms || "",
      price: String(voucher.price),
      code: voucher.code,
      is_active: voucher.is_active,
      expiry_date: voucher.expiry_date ? voucher.expiry_date.split("T")[0] : "",
      usage_limit: String(voucher.usage_limit || 0),
      limit_per_user: String(voucher.limit_per_user || 0),
      voucher_type: (voucher.voucher_type as "ticket" | "food") || "ticket",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.image_url || !form.price || !form.code) {
      toast.error("Title, Image URL, Price and Code are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        image_url: form.image_url,
        terms: form.terms,
        price: parseFloat(form.price),
        code: form.code.toUpperCase(),
        is_active: form.is_active,
        expiry_date: form.expiry_date ? new Date(form.expiry_date).toISOString() : null,
        usage_limit: parseInt(form.usage_limit || "0"),
        limit_per_user: parseInt(form.limit_per_user || "0"),
        voucher_type: form.voucher_type,
      };

      if (editing) {
        await updateVoucher(editing.id, payload);
        toast.success("Promo / Voucher updated");
      } else {
        await createVoucher(payload);
        toast.success("Promo / Voucher created");
      }
      setShowModal(false);
      loadVouchers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVoucher(id);
      toast.success("Promo code / Voucher deleted");
      setDeleteConfirm(null);
      loadVouchers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const filtered = vouchers.filter((v) => {
    const vType = v.voucher_type || "ticket";
    return vType === activeListTab && (
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.code.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E2F1FE] flex items-center justify-center">
            <Tag className="w-5 h-5 text-[#0B70D5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#131316]">Promo Codes / Vouchers</h1>
            <p className="text-sm text-[#8E8E93]">{vouchers.length} total codes</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm w-[220px] bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => openCreateModal("ticket")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0B70D5] text-white text-sm font-semibold hover:bg-[#095eb5] transition-all cursor-pointer border-0"
          >
            <Plus className="w-4 h-4" />
            Add Promo
          </button>
          <button
            onClick={() => openCreateModal("food")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#131316] text-white text-sm font-semibold hover:bg-[#2C2C30] transition-all cursor-pointer border-0"
          >
            <Plus className="w-4 h-4" />
            Add Voucher
          </button>
        </div>
      </div>

      {/* List Tabs */}
      <div className="flex border-b border-[#E8E8EA] mb-6">
        <button
          onClick={() => setActiveListTab("ticket")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer bg-transparent border-0 outline-none ${
            activeListTab === "ticket"
              ? "border-[#0B70D5] text-[#0B70D5]"
              : "border-transparent text-[#8E8E93] hover:text-[#131316]"
          }`}
        >
          Movie Promos (Ticket Vouchers)
        </button>
        <button
          onClick={() => setActiveListTab("food")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer bg-transparent border-0 outline-none ${
            activeListTab === "food"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-[#8E8E93] hover:text-[#131316]"
          }`}
        >
          Food Vouchers (F&B)
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#0B70D5] animate-spin" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white border border-[#E8E8EA] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E8E8EA] bg-[#FAFAFA]">
                  <th className="px-5 py-3.5 text-left text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">Image</th>
                  <th className="px-5 py-3.5 text-left text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3.5 text-left text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                    {activeListTab === "ticket" ? "Promo Code" : "Voucher ID"}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">Price</th>
                  <th className="px-5 py-3.5 text-left text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#8E8E93] text-sm">
                      No {activeListTab === "ticket" ? "movie promos" : "food vouchers"} found. Create one!
                    </td>
                  </tr>
                ) : (
                  filtered.map((voucher) => (
                    <tr key={voucher.id} className="border-b border-[#E8E8EA] last:border-b-0 hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="relative w-[80px] h-[28px] rounded-md overflow-hidden bg-[#F5F5F6]">
                          <Image src={voucher.image_url} alt={voucher.title} fill className="object-cover" sizes="80px" />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-[#131316] truncate max-w-[200px]">{voucher.title}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded ${
                          activeListTab === "ticket" ? "text-[#0B70D5] bg-[#E2F1FE]" : "text-amber-600 bg-amber-500/10"
                        }`}>{voucher.code}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-[#131316]">{formatCurrency(voucher.price)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${voucher.is_active ? "bg-[#34C759]/10 text-[#34C759]" : "bg-[#FF3B30]/10 text-[#FF3B30]"}`}>
                          {voucher.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {voucher.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(voucher)}
                            className="p-2 rounded-lg text-[#545459] hover:bg-[#F5F5F6] hover:text-[#0B70D5] transition-colors cursor-pointer border-0 bg-transparent"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(voucher.id)}
                            className="p-2 rounded-lg text-[#545459] hover:bg-[#FEE2E2] hover:text-[#FF3B30] transition-colors cursor-pointer border-0 bg-transparent"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-[540px] max-h-[90vh] bg-white rounded-[20px] shadow-2xl overflow-y-auto z-10"
            >
              <div className="p-6 border-b border-[#E8E8EA] flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold text-[#131316]">
                  {editing 
                    ? (form.voucher_type === "food" ? "Edit Food Voucher" : "Edit Ticket Promo")
                    : (form.voucher_type === "food" ? "Create Food Voucher" : "Create Ticket Promo")
                  }
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E8E93] hover:bg-[#F5F5F6] transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Image Preview & Upload */}
                <div>
                  <label className="text-[#545459] text-[12px] font-medium block mb-2">
                    {form.voucher_type === "food" ? "Food Image Banner *" : "Movie Promo Image Banner *"}
                  </label>
                  <ImageUpload
                    value={form.image_url}
                    onChange={(url) => setForm({ ...form, image_url: url })}
                    bucket="vouchers"
                    label="Upload Banner"
                    aspectRatio="aspect-[3/2]"
                    widthClass="w-full"
                  />
                </div>

                <div>
                  <label className="text-[#545459] text-[12px] font-medium block mb-1">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder={form.voucher_type === "food" ? "e.g. Burger + Cold Drink Combo" : "e.g. Weekend Movie Discount"}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[#545459] text-[12px] font-medium block mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={form.voucher_type === "food" ? "Describe the food combo..." : "Describe the movie ticket offer..."}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-[#545459] text-[12px] font-medium block mb-1">Terms & Conditions</label>
                  <textarea
                    value={form.terms}
                    onChange={(e) => setForm({ ...form, terms: e.target.value })}
                    placeholder="Enter terms and conditions..."
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#545459] text-[12px] font-medium block mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="199"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    {form.voucher_type === "ticket" ? (
                      <>
                        <label className="text-[#545459] text-[12px] font-medium block mb-1">Promo Code *</label>
                        <input
                          value={form.code}
                          onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                          placeholder="WEEKEND50"
                          className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all font-mono"
                        />
                      </>
                    ) : (
                      <>
                        <label className="text-[#545459] text-[12px] font-medium block mb-1">Voucher ID (Auto-generated)</label>
                        <input
                          value={form.code}
                          disabled
                          className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-[#FAFAFA] text-[#8E8E93] outline-none font-mono cursor-not-allowed"
                        />
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[#545459] text-[12px] font-medium block mb-1">Total Limit (0 = unlimited)</label>
                    <input
                      type="number"
                      value={form.usage_limit}
                      onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[#545459] text-[12px] font-medium block mb-1">Limit Per User (0 = unlimited)</label>
                    <input
                      type="number"
                      value={form.limit_per_user}
                      onChange={(e) => setForm({ ...form, limit_per_user: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#545459] text-[12px] font-medium block mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-[#E8E8EA] peer-focus:ring-2 peer-focus:ring-[#0B70D5]/20 rounded-full peer peer-checked:bg-[#34C759] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                  <span className="text-sm text-[#545459]">Active (visible to users)</span>
                </div>
              </div>

              <div className="p-6 border-t border-[#E8E8EA] flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-[#E8E8EA] text-sm font-semibold text-[#545459] hover:bg-[#F5F5F6] transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#131316] text-white text-sm font-semibold hover:bg-[#2C2C30] transition-all cursor-pointer border-0 disabled:opacity-60 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? "Update" : "Create"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl z-10"
            >
              <h3 className="text-lg font-bold text-[#131316] mb-2">Delete Promo / Voucher?</h3>
              <p className="text-sm text-[#545459] mb-5">This action cannot be undone. Users who already purchased this voucher will not be affected.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-xl border border-[#E8E8EA] text-sm font-semibold text-[#545459] hover:bg-[#F5F5F6] transition-all cursor-pointer bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 rounded-xl bg-[#FF3B30] text-white text-sm font-semibold hover:bg-[#E6352B] transition-all cursor-pointer border-0"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
