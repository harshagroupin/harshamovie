"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Gift, ImageIcon, Loader2, Eye, EyeOff, Search } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { getVouchers, createVoucher, updateVoucher, deleteVoucher } from "@/actions/vouchers";
import type { Voucher } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    terms: "",
    price: "",
    code: "",
    is_active: true,
  });

  const loadVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVouchers();
      setVouchers(data);
    } catch {
      toast.error("Failed to load vouchers");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({ title: "", description: "", image_url: "", terms: "", price: "", code: "", is_active: true });
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
      };

      if (editing) {
        await updateVoucher(editing.id, payload);
        toast.success("Voucher updated");
      } else {
        await createVoucher(payload);
        toast.success("Voucher created");
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
      toast.success("Voucher deleted");
      setDeleteConfirm(null);
      loadVouchers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const filtered = vouchers.filter((v) =>
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E2F1FE] flex items-center justify-center">
            <Gift className="w-5 h-5 text-[#0B70D5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#131316]">Voucher Management</h1>
            <p className="text-sm text-[#8E8E93]">{vouchers.length} total vouchers</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vouchers..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm w-[220px] bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
            />
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#131316] text-white text-sm font-semibold hover:bg-[#2C2C30] transition-all cursor-pointer border-0"
          >
            <Plus className="w-4 h-4" />
            Add Voucher
          </button>
        </div>
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
                  <th className="px-5 py-3.5 text-left text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">Code</th>
                  <th className="px-5 py-3.5 text-left text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">Price</th>
                  <th className="px-5 py-3.5 text-left text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-[12px] font-semibold text-[#8E8E93] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-[#8E8E93] text-sm">
                      No vouchers found. Create your first voucher!
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
                        <span className="font-mono text-sm font-bold text-[#0B70D5] bg-[#E2F1FE] px-2 py-0.5 rounded">{voucher.code}</span>
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
                  {editing ? "Edit Voucher" : "Create Voucher"}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8E8E93] hover:bg-[#F5F5F6] transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Image Preview */}
                {form.image_url && (
                  <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-[#F5F5F6]">
                    <Image src={form.image_url} alt="Preview" fill className="object-cover" sizes="540px" />
                  </div>
                )}

                <div>
                  <label className="text-[#545459] text-[12px] font-medium block mb-1">Image URL *</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E93]" />
                    <input
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="https://your-supabase-storage-url/image.jpg"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#545459] text-[12px] font-medium block mb-1">Title *</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Weekend Movie Voucher"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="text-[#545459] text-[12px] font-medium block mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Voucher description..."
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
                    <label className="text-[#545459] text-[12px] font-medium block mb-1">Voucher Code *</label>
                    <input
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      placeholder="WEEKEND50"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E8E8EA] text-sm bg-white focus:border-[#0B70D5] focus:ring-1 focus:ring-[#0B70D5]/20 outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
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
              <h3 className="text-lg font-bold text-[#131316] mb-2">Delete Voucher?</h3>
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
