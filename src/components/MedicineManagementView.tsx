import React, { useState, useEffect } from "react";
import { api } from "../api";
import { Medicine } from "../types";
import { Plus, Trash, Edit, Star, Camera, CheckSquare, Sparkles, Clipboard, AlertCircle, ShoppingBag } from "lucide-react";

interface MedicineManagementViewProps {
  selectedPatientId?: string; // Caregiver passive tracking
}

export default function MedicineManagementView({ selectedPatientId }: MedicineManagementViewProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "as_needed">("daily");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [duration, setDuration] = useState(30);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("Tablet");
  const [stock, setStock] = useState(30);
  const [minStock, setMinStock] = useState(5);
  const [description, setDescription] = useState("");

  // Prescription OCR scanning states
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  const currentUser = api.getCurrentUser();
  const isViewingAsCaregiver = !!selectedPatientId && currentUser?.role === "caregiver";

  useEffect(() => {
    fetchMedicines();
  }, [selectedPatientId]);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const list = await api.getMedicines(selectedPatientId || undefined);
      setMedicines(list);
    } catch (e) {
      console.error("Failed to load medicines:", e);
    } finally {
      setLoading(false);
    }
  };

  // Auto calculate endDate based on duration
  useEffect(() => {
    if (startDate && duration) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + parseInt(duration.toString()));
      setEndDate(d.toISOString().split("T")[0]);
    }
  }, [startDate, duration]);

  const resetForm = () => {
    setName("");
    setDosage("");
    setFrequency("daily");
    setTimes(["08:00"]);
    setDuration(30);
    setStartDate(new Date().toISOString().split("T")[0]);
    setCategory("Tablet");
    setStock(30);
    setMinStock(5);
    setDescription("");
    setIsEditing(null);
  };

  const handleAddFieldTime = () => {
    setTimes([...times, "12:00"]);
  };

  const handleRemoveFieldTime = (index: number) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, val: string) => {
    const updated = [...times];
    updated[index] = val;
    setTimes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage || !startDate) {
      alert("Please fill in main drug details");
      return;
    }

    const payload = {
      name,
      dosage,
      frequency,
      times,
      duration,
      startDate,
      endDate,
      category,
      stock,
      minStock,
      description
    };

    try {
      if (isEditing) {
        await api.updateMedicine(isEditing, payload);
      } else {
        await api.createMedicine(payload);
      }
      resetForm();
      setShowAddForm(false);
      fetchMedicines();
    } catch (err: any) {
      alert(err?.message || "Failed to commit medicine attributes");
    }
  };

  const handleEditClick = (med: Medicine) => {
    setIsEditing(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setTimes(med.times || ["08:00"]);
    setDuration(med.duration);
    setStartDate(med.startDate);
    setEndDate(med.endDate);
    setCategory(med.category);
    setStock(med.stock);
    setMinStock(med.minStock);
    setDescription(med.description || "");
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to discontinue this medicine and purge future pending reminders?")) return;
    try {
      await api.deleteMedicine(id);
      fetchMedicines();
    } catch (e) {
      alert("Error deleting medication.");
    }
  };

  // Convert files for OCR Scan
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setOcrError("File is too large. Max allowed size is 5MB.");
      return;
    }

    setOcrLoading(true);
    setOcrError(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await api.runOCR(base64Data, file.type);
        setOcrResult(res);
      } catch (err: any) {
        setOcrError(err?.message || "OCR Processing encountered a cognitive error.");
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // High quality Preset Demo Prescriptions base64 for instant testing
  const runPresetOCR = async (type: "general" | "cardio") => {
    setOcrLoading(true);
    setOcrError(null);
    setOcrResult(null);

    // Simulated medical prescription note uploader base64 representation
    const mockImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    try {
      const res = await api.runOCR(mockImageBase64, "image/png");
      setOcrResult(res);
    } catch (err: any) {
      setOcrError(err?.message || "OCR Parsing failed");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleApplyPresetMed = (med: any) => {
    setName(med.name || "");
    setDosage(med.dosage || "");
    setFrequency(med.frequency || "daily");
    setTimes(med.times && med.times.length > 0 ? med.times : ["08:00"]);
    setDuration(med.duration || 10);
    setCategory(med.category || "Tablet");
    setDescription(med.description || "Parsed from clinical OCR scanner.");
    setOcrResult(null);
    setIsEditing(null);
    setShowAddForm(true);
  };

  return (
    <div id="med-management-wrapper" className="space-y-6">
      {/* Page Header */}
      <div id="meds-header" className="flex justify-between items-center bg-white p-6 border border-slate-200/80 rounded-2xl">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-800">Medication Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {isViewingAsCaregiver 
              ? "Overseeing patient drug inventory stock thresholds and schedule configurations." 
              : "Set drug timing rules, view current inventory, and extract physical notes."}
          </p>
        </div>

        {!isViewingAsCaregiver && !showAddForm && (
          <button
            id="add-meds-toggle-btn"
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl cursor-pointer transition-all shadow-md shadow-teal-500/10"
          >
            <Plus size={16} />
            Add Medication
          </button>
        )}
      </div>

      {/* Prescription AI Scanner Widget */}
      {!isViewingAsCaregiver && !showAddForm && (
        <div id="ai-scanner-panel" className="bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold bg-white/20 text-white uppercase tracking-widest px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Sparkles size={11} /> Cognitive Vision AI
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">Prescription OCR Scanner</h2>
            <p className="text-xs text-teal-100 max-w-lg leading-relaxed">
              Upload a snapshot of raw physician doctor handwritten notes or digital slips. Gemini automatically deciphers titles, dosages, and daily frequencies to fill drug schedules in 1-click.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            {/* File Upload Hidden */}
            <label className="flex-1 py-3 px-4 bg-white text-teal-700 font-bold text-xs rounded-xl hover:bg-teal-50 hover:shadow-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer">
              <Camera size={16} />
              <span>Camera Upload</span>
              <input
                id="file-ocr-uploader"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={ocrLoading}
              />
            </label>

            {/* Simulated preset quick check */}
            <button
              id="ocr-demo-btn"
              onClick={() => runPresetOCR("general")}
              disabled={ocrLoading}
              className="flex-1 py-3 px-4 bg-teal-800/80 hover:bg-teal-800 text-white border border-teal-500/20 font-bold text-xs rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Test Demo Slip</span>
            </button>
          </div>
        </div>
      )}

      {/* OCR processing screens */}
      {ocrLoading && (
        <div id="ocr-loader-display" className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <span className="inline-block animate-spin h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full mb-3"></span>
          <h3 className="font-bold text-slate-800 text-base">Gemini Deciphering Prescription...</h3>
          <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto mt-1">Analyzing handwriting, mapping medicines to medical registry, and configuring scheduling guidelines.</p>
        </div>
      )}

      {ocrError && (
        <div id="ocr-error-display" className="bg-red-50 border border-red-200 p-4 rounded-2xl text-red-800 flex items-center gap-2.5">
          <AlertCircle size={18} />
          <p className="text-xs font-semibold">{ocrError}</p>
        </div>
      )}

      {ocrResult && (
        <div id="ocr-results-panel" className="bg-white border border-teal-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <CheckSquare size={16} className="text-teal-600" /> Deciphered Prescription Details
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Please review medications discovered by Vision core. Click Apply to edit or save.</p>
            </div>
            <button
              onClick={() => setOcrResult(null)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 border border-slate-200 rounded-lg py-1 px-2 cursor-pointer"
            >
              Clear
            </button>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl flex justify-between text-xs font-semibold text-slate-700">
            <p>Physician: <span className="text-slate-900 font-extrabold">{ocrResult.doctorName || "Not Found"}</span></p>
            <p>Issued Date: <span className="text-slate-900 font-extrabold">{ocrResult.date || "Not Found"}</span></p>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {ocrResult.medications?.map((m: any, index: number) => (
              <div key={index} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-800 text-sm">{m.name} <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-1.5 py-0.5 rounded-sm">{m.dosage}</span></p>
                  <p className="text-slate-500 font-medium">Frequency: <span className="text-slate-700 font-bold capitalize">{m.frequency}</span> | Days: <span className="text-slate-700 font-bold">{m.duration} days</span></p>
                  {m.description && <p className="text-slate-400 italic font-medium">{m.description}</p>}
                </div>
                <button
                  id={`apply-parsed-${index}`}
                  onClick={() => handleApplyPresetMed(m)}
                  className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1 w-fit"
                >
                  <Plus size={12} />
                  <span>Apply Schematics</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medication Entry Form */}
      {showAddForm && (
        <form id="medication-setup-form" onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <h3 className="font-extrabold text-slate-800 text-base">
              {isEditing ? "Modify Medication Schematic" : "Setup New Medication Course"}
            </h3>
            <button
              id="cancel-add-med"
              type="button"
              onClick={() => { setShowAddForm(false); resetForm(); }}
              className="text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              Back To Logs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Medicine Name */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Drug Trademark Name *</label>
              <input
                id="form-med-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Atorvastatin or Amoxicillin"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Dosage Category</label>
              <select
                id="form-med-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none h-[38px]"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Injection">Injection</option>
                <option value="Syrup">Syrup</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Dosage Strength */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Dosage Strength / Amount *</label>
              <input
                id="form-med-dosage"
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 10mg, 1 tablet, 5ml"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            {/* Frequency type */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Frequency Interval *</label>
              <select
                id="form-med-frequency"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none h-[38px]"
              >
                <option value="daily">Daily Schedule</option>
                <option value="weekly">Weekly Schedule</option>
                <option value="as_needed">PRN (As Needed)</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Start Date *</label>
              <input
                id="form-med-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Total Duration Course (Days)</label>
              <input
                id="form-med-duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            {/* Inventory Stock Count */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block mr-2 inline-flex items-center gap-1">
                <ShoppingBag size={14} className="text-teal-600" /> Current Stock Count (Units)
              </label>
              <input
                id="form-med-stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
              />
            </div>

            {/* Inventory Minimum Stock Threshold */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Inventory Minimum Alert Threshold</label>
              <input
                id="form-med-minstock"
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Timing rules list */}
          {frequency !== "as_needed" && (
            <div className="space-y-2.5 border-t border-slate-50 pt-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600">Daily Dosage Timings (HH:MM)</label>
                <button
                  id="add-time-btn"
                  type="button"
                  onClick={handleAddFieldTime}
                  className="text-xs text-teal-600 hover:text-teal-700 font-bold"
                >
                  + Add Timing
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {times.map((t, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center">
                    <input
                      type="time"
                      required
                      value={t}
                      onChange={(e) => handleTimeChange(idx, e.target.value)}
                      className="border border-slate-200 rounded-xl px-2 py-1.5 text-xs focus:border-teal-500 outline-none flex-1"
                    />
                    {times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFieldTime(idx)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs px-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Special instructions decription */}
          <div className="border-t border-slate-50 pt-4">
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Special Instructions & Indications</label>
            <textarea
              id="form-med-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Take after breakfast. Don't chew tablet. High compliance required."
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-teal-500 outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              id="form-submit-btn"
              type="submit"
              className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs sm:text-sm cursor-pointer hover:shadow-lg transition-all"
            >
              {isEditing ? "Save Schematic Changes" : "Commit New Treatment Program"}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); resetForm(); }}
              className="flex-1 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold rounded-xl text-xs sm:text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Medicines active directory */}
      {!showAddForm && (
        <div className="space-y-4">
          <h2 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Active Medication Registry</h2>

          {loading ? (
            <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl">
              <span className="inline-block animate-spin h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full mb-2"></span>
              <p className="text-xs text-slate-400 font-semibold">Updating medication directories...</p>
            </div>
          ) : medicines.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl">
              <Clipboard size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-semibold text-sm">No active medicine programs recorded.</p>
              <p className="text-slate-400 text-xs mt-1">Configure your clinic guidelines or run the uploader.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {medicines.map((m) => {
                const isOutOfStock = m.stock <= 0;
                const isLowStock = m.stock > 0 && m.stock <= m.minStock;

                return (
                  <div key={m.id} className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start gap-2.5 flex-wrap">
                        <div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 bg-slate-100 text-slate-700`}>
                            {m.category || "Tablet"}
                          </span>
                          <h3 className="font-extrabold text-slate-800 text-sm">{m.name}</h3>
                          <p className="text-xs text-slate-500 font-semibold">Dosing Rule: {m.dosage} • <span className="capitalize text-teal-600 font-bold">{m.frequency}</span></p>
                        </div>

                        {/* Stock Counter Tag */}
                        <div className="text-right">
                          <span className={`text-xs font-black px-2 mt-1.5 py-1 rounded-lg border inline-block ${
                            isOutOfStock 
                              ? "bg-red-50 border-red-200 text-red-800" 
                              : isLowStock 
                                ? "bg-amber-50 border-amber-200 text-amber-800" 
                                : "bg-teal-50 border-teal-100 text-teal-800"
                          }`}>
                            {m.stock} Doses Left
                          </span>
                        </div>
                      </div>

                      {/* Timings */}
                      {m.frequency !== "as_needed" && m.times && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Daily:</span>
                          {m.times.map((t, idx) => (
                            <span key={idx} className="bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Duration */}
                      <p className="text-[11px] text-slate-500 font-medium">
                        Period: <span className="font-semibold text-slate-700">{m.startDate}</span> to <span className="font-semibold text-slate-700">{m.endDate}</span> ({m.duration} days course)
                      </p>

                      {m.description && (
                        <p className="text-xs bg-slate-50 px-3 py-2 rounded-xl text-slate-500 border border-slate-100 italic leading-snug">
                          {m.description}
                        </p>
                      )}
                    </div>

                    {!isViewingAsCaregiver && (
                      <div className="flex gap-2 pt-3 border-t border-slate-50">
                        <button
                          id={`edit-med-${m.id}`}
                          onClick={() => handleEditClick(m)}
                          className="flex-1 py-1.5 border border-slate-200 border-dashed hover:border-slate-500 text-slate-600 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Edit size={12} />
                          <span>Modify</span>
                        </button>
                        <button
                          id={`delete-med-${m.id}`}
                          onClick={() => handleDelete(m.id)}
                          className="flex-1 py-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Trash size={12} />
                          <span>Terminate</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
