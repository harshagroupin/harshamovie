"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Tag, Percent, IndianRupee } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PageTransition } from "@/components/shared/page-transition";
import { getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode } from "@/actions/promos";
import type { PromoCode } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "10",
    usage_limit: "0",
    expiry_date: "",
    is_active: true,
  });

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const data = await getPromoCodes();
      setPromos(data);
    } catch (err: any) {
      console.error("Promo fetch error:", err);
      toast.error(err?.message || "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromos(); }, []);

  const resetForm = () => {
    setForm({ code: "", discount_type: "percentage", discount_value: "10", usage_limit: "0", expiry_date: "", is_active: true });
    setEditing(null);
  };

  const openEdit = (p: PromoCode) => {
    setEditing(p);
    setForm({
      code: p.code,
      discount_type: p.discount_type,
      discount_value: String(p.discount_value),
      usage_limit: String(p.usage_limit),
      expiry_date: p.expiry_date || "",
      is_active: p.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim()) { toast.error("Code is required"); return; }
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        usage_limit: parseInt(form.usage_limit),
        expiry_date: form.expiry_date || null,
        is_active: form.is_active,
      };
      if (editing) {
        await updatePromoCode(editing.id, payload);
        toast.success("Promo code updated!");
      } else {
        await createPromoCode(payload);
        toast.success("Promo code created!");
      }
      setDialogOpen(false);
      resetForm();
      fetchPromos();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    try {
      await deletePromoCode(id);
      setPromos((p) => p.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const activePromos = promos.filter(p => p.is_active).length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F1117] tracking-tight">Promo Codes</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{promos.length} codes · {activePromos} active</p>
          </div>
          <button
            onClick={() => { resetForm(); setDialogOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#CC0812] text-white text-sm font-bold transition-all shadow-lg shadow-red-500/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add Code
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[#E50914] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#9CA3AF] text-sm">Loading promo codes...</p>
          </div>
        ) : promos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] py-20 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FEF2F2] flex items-center justify-center mb-4">
              <Tag className="w-7 h-7 text-[#E50914]" />
            </div>
            <h3 className="font-bold text-[#111827] text-base mb-1">No promo codes yet</h3>
            <p className="text-[#9CA3AF] text-sm mb-4">Create your first discount code</p>
            <button
              onClick={() => { resetForm(); setDialogOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] text-white text-sm font-bold hover:bg-[#CC0812] transition-all"
            >
              <Plus className="w-4 h-4" /> Add Promo Code
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Code</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Discount</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">Usage</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Expiry</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-5 text-[#6B7280] font-semibold text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.map((p, i) => (
                    <tr key={p.id} className="border-t border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-mono font-black text-[#E50914] text-sm bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                          {p.code}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center border border-amber-100">
                            {p.discount_type === "percentage"
                              ? <Percent className="w-3 h-3 text-amber-600" />
                              : <IndianRupee className="w-3 h-3 text-amber-600" />
                            }
                          </div>
                          <span className="font-bold text-amber-700 text-sm">
                            {p.discount_type === "percentage" ? `${p.discount_value}% off` : `₹${p.discount_value} off`}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-5 hidden sm:table-cell">
                        <span className="text-[#6B7280] text-sm">
                          {p.times_used} / {p.usage_limit || <span className="text-[#D1D5DB]">∞</span>}
                        </span>
                      </td>
                      <td className="py-4 px-5 hidden md:table-cell text-[#6B7280] text-sm">
                        {p.expiry_date || <span className="text-[#D1D5DB]">No expiry</span>}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          p.is_active
                            ? "bg-green-50 text-green-700 border border-green-100"
                            : "bg-[#F3F4F6] text-[#9CA3AF] border border-[#E5E7EB]"
                        }`}>
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5 text-[#374151]" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="w-8 h-8 rounded-lg bg-[#F3F4F6] hover:bg-red-50 flex items-center justify-center transition-colors group"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[#9CA3AF] group-hover:text-[#E50914]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-[#0F1117]">
                {editing ? "Edit" : "Add"} Promo Code
              </DialogTitle>
              <DialogDescription className="text-[#6B7280] text-sm">
                {editing ? "Update promo code details" : "Create a new discount code"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#374151] font-semibold text-xs uppercase tracking-wider">Code *</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SUMMER50"
                  className="uppercase font-mono font-bold text-[#E50914] border-[#E5E7EB] focus:border-[#E50914]/40 focus:ring-[#E50914]/10"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#374151] font-semibold text-xs uppercase tracking-wider">Type</Label>
                  <Select value={form.discount_type} onValueChange={(v) => setForm((p) => ({ ...p, discount_type: v as any }))}>
                    <SelectTrigger className="border-[#E5E7EB]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#374151] font-semibold text-xs uppercase tracking-wider">Value</Label>
                  <Input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                    className="border-[#E5E7EB]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#374151] font-semibold text-xs uppercase tracking-wider">Usage Limit</Label>
                  <Input
                    type="number"
                    placeholder="0 = unlimited"
                    value={form.usage_limit}
                    onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))}
                    className="border-[#E5E7EB]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#374151] font-semibold text-xs uppercase tracking-wider">Expiry Date</Label>
                  <Input
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))}
                    className="border-[#E5E7EB]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between bg-[#F9FAFB] rounded-xl p-4">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">Active</p>
                  <p className="text-xs text-[#9CA3AF]">Enable or disable this promo code</p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, is_active: v }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#E5E7EB] text-[#374151] text-sm font-semibold hover:bg-[#F9FAFB] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#CC0812] text-white text-sm font-bold transition-all disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
