import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseWithOwnAI } from "../ai/BillParser";
import Tesseract from "tesseract.js";
import {
  X,
  Zap,
  ZapOff,
  Camera,
  ImagePlus,
  CheckCircle2,
  Edit2,
} from "lucide-react";
import { saveExpense } from "../services/saveExpense";

interface ScanScreenProps {
  onClose: () => void;
  onSave: (amount?: number) => void;
}

const CATEGORIES = [
  { label: "Petrol", emoji: "⛽" },
  { label: "Food", emoji: "🍽️" },
  { label: "Groceries", emoji: "🛒" },
  { label: "Transport", emoji: "🚌" },
  { label: "Movies", emoji: "🎬" },
  { label: "Hospital", emoji: "🏥" },
  { label: "Other", emoji: "📄" },
];

const CAT_META: Record<string, { icon: string; color: string }> = {
  Petrol: { icon: "⛽", color: "#EDF4FD" },
  Food: { icon: "🍽️", color: "#FFF8EE" },
  Groceries: { icon: "🛒", color: "#F0FAF5" },
  Transport: { icon: "🚌", color: "#F0FDF4" },
  Movies: { icon: "🎬", color: "#F3F0FD" },
  Hospital: { icon: "🏥", color: "#FEF2F2" },
  Other: { icon: "📄", color: "#F5F5F5" },
};

export function ScanScreen({ onClose, onSave }: ScanScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [scanState, setScanState] = useState<
    "scanning" | "processing" | "detected"
  >("scanning");

  const [flashOn, setFlashOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(true);
  const [cameraError, setCameraError] = useState("");

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [merchant, setMerchant] = useState("");
  const [confidence, setConfidence] = useState(0);

  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [rawOCRText, setRawOCRText] = useState("");

  useEffect(() => {
    startCamera();

    (window as any).onMLKitResult = (text: string) => {
      processScannedText(text);
    };

    (window as any).onMLKitError = () => {
      setCameraError("Could not read text clearly. Please try again.");
      setScanState("scanning");
    };

    return () => {
      stopCamera();
      delete (window as any).onMLKitResult;
      delete (window as any).onMLKitError;
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });

      streamRef.current = stream;

      // Check if torch is supported on this device
      const track = stream.getVideoTracks()[0];
      const capabilities = track?.getCapabilities?.() as any;
      if (!capabilities?.torch) {
        setTorchSupported(false);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Camera access denied. Use gallery option.");
    }
  };

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    const newFlashState = !flashOn;
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: newFlashState } as any],
      });
      setFlashOn(newFlashState);
    } catch (err) {
      console.warn("Torch not supported on this device:", err);
      setTorchSupported(false);
      // Still toggle visual state as fallback indicator
      setFlashOn(newFlashState);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const runWebOCR = async (imageData: string) => {
    try {
      const result = await Tesseract.recognize(imageData, "eng", {
        logger: (m) => console.log("Tesseract:", m),
      });

      processScannedText(result.data.text);
    } catch (err) {
      console.error("Web OCR failed:", err);
      alert("OCR failed. Please try a clearer image.");
      setScanState("scanning");
    }
  };

  const processScannedText = (text: string) => {
    console.log("OCR TEXT:", text);

    setRawOCRText(text);

    const parsed = parseWithOwnAI(text);

    setAmount(parsed.amount > 0 ? String(parsed.amount) : "");
    setMerchant(parsed.merchant || "Unknown Merchant");
    setCategory(parsed.category || "Other");
    setConfidence(parsed.amount > 0 ? 90 : 0);

    setScanState("detected");
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    setScanState("processing");
    setCameraError("");

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;

    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    if ((window as any).AndroidBridge?.scanBill) {
      (window as any).AndroidBridge.scanBill(imageData);
    } else {
      runWebOCR(imageData);
    }
  };

  const openGallery = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setScanState("processing");
    setCameraError("");

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result as string;

      if ((window as any).AndroidBridge?.scanBill) {
        (window as any).AndroidBridge.scanBill(imageData);
      } else {
        runWebOCR(imageData);
      }
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    const numAmount = Number(amount);

    if (!amount || numAmount <= 0) {
      setSaveError("Please enter a valid amount");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const meta = CAT_META[category] ?? CAT_META.Other;

      await saveExpense({
        amount: numAmount,
        category,
        merchant: merchant || "Unknown Merchant",
        date: new Date().toISOString().split("T")[0],
        icon: meta.icon,
        color: meta.color,
      });

      stopCamera();
      onSave(numAmount);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    setAmount("");
    setCategory("Other");
    setMerchant("");
    setConfidence(0);
    setSaveError("");
    setRawOCRText("");
    setIsEditingAmount(false);
    setScanState("scanning");
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ position: "fixed", top: "-9999px", opacity: 0 }}
      />

      <div className="w-full h-full bg-black relative overflow-hidden">
        <video
          ref={videoRef}
          className="absolute w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent z-10" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 to-transparent z-10" />

        <div className="absolute top-0 w-full flex justify-between items-center px-6 pt-14 pb-4 z-20">
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform active:scale-95"
          >
            <X size={22} className="text-white" />
          </button>

          <span className="font-sora font-semibold text-white text-[17px] tracking-wide shadow-black/50 drop-shadow-md">Scan Bill</span>

          <button
            onClick={toggleFlash}
            className={`w-11 h-11 rounded-full backdrop-blur-md border border-white/20 flex items-center justify-center transition-all active:scale-95 ${
              flashOn ? "bg-amber-400" : "bg-black/40"
            } ${!torchSupported ? "opacity-40" : ""}`}
            title={!torchSupported ? "Torch not supported on this device" : flashOn ? "Turn off flash" : "Turn on flash"}
          >
            {flashOn ? (
              <Zap size={22} className="text-black" fill="currentColor" />
            ) : (
              <ZapOff size={22} className="text-white" />
            )}
          </button>
        </div>

        {cameraError && (
          <div className="absolute top-24 inset-x-4 bg-red-500/90 text-white text-sm text-center py-2 px-4 rounded-xl z-20">
            {cameraError}
          </div>
        )}

        {scanState === "scanning" && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <motion.div 
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="w-72 h-48 border border-white/20 rounded-3xl relative"
            >
              <span className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-white rounded-tl-[24px]" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-white rounded-tr-[24px]" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-white rounded-bl-[24px]" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-white rounded-br-[24px]" />
            </motion.div>
          </div>
        )}

        {scanState === "processing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white text-lg">Reading bill...</p>
          </div>
        )}

        <AnimatePresence>
          {scanState === "detected" && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute bottom-0 w-full bg-white dark:bg-dark-card rounded-t-[32px] z-30 px-6 pt-5 pb-10 max-h-[88%] overflow-y-auto shadow-floating"
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-8" />

              <div className="space-y-7">
                <div>
                  <p className="font-dm text-[11px] uppercase tracking-[0.1em] text-text-tertiary font-bold mb-2">
                    Merchant
                  </p>

                  <input
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    className="w-full font-sora text-[22px] font-semibold border-b-2 border-gray-100 dark:border-white/10 pb-2 focus:outline-none focus:border-brand-green bg-transparent text-text-primary dark:text-white transition-colors"
                    placeholder="Enter merchant name"
                  />
                </div>

                <div>
                  <p className="font-dm text-[11px] uppercase tracking-[0.1em] text-text-tertiary font-bold mb-2">
                    Amount
                  </p>

                  <div className="flex items-center gap-4">
                    {isEditingAmount ? (
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onBlur={() => setIsEditingAmount(false)}
                        autoFocus
                        className="font-mono text-[48px] font-bold w-full focus:outline-none border-b-2 border-brand-green bg-transparent text-text-primary dark:text-white"
                      />
                    ) : (
                      <h2 className="font-mono text-[48px] font-bold text-text-primary dark:text-white tracking-tight">
                        ₹{amount ? Number(amount).toLocaleString("en-IN") : "0"}
                      </h2>
                    )}

                    <button
                      onClick={() => setIsEditingAmount((v) => !v)}
                      className="w-12 h-12 bg-muted dark:bg-white/5 rounded-full flex items-center justify-center flex-shrink-0 text-text-secondary dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                  </div>

                  {confidence > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="w-2 h-2 rounded-full bg-brand-green" />
                      <p className="font-dm text-[12px] text-brand-green font-medium">
                        {confidence}% AI Confidence
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-dm text-[11px] uppercase tracking-[0.1em] text-text-tertiary font-bold mb-3">
                    Category
                  </p>

                  <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                    {CATEGORIES.map((cat) => {
                      const isSelected = category === cat.label;
                      return (
                        <button
                          key={cat.label}
                          onClick={() => setCategory(cat.label)}
                          className={`px-5 py-3 rounded-[16px] whitespace-nowrap font-dm text-[13px] font-semibold transition-all flex items-center gap-2 border ${
                            isSelected
                              ? "bg-brand-green/10 border-brand-green text-brand-dark dark:text-brand-green"
                              : "bg-white dark:bg-white/5 border-gray-100 dark:border-white/5 text-text-secondary dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10"
                          }`}
                        >
                          <span className="text-[16px]">{cat.emoji}</span> {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {rawOCRText && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-1">Raw OCR Debug</p>
                  <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs text-gray-600 dark:text-gray-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {rawOCRText}
                  </pre>
                </div>
              )}

              {saveError && (
                <p className="text-red-500 text-sm mt-4">{saveError}</p>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !amount || Number(amount) <= 0}
                className="w-full mt-10 h-[60px] bg-gradient-to-r from-brand-green to-brand-green-gradient text-white rounded-card flex items-center justify-center gap-2 font-sora font-semibold text-[16px] shadow-fab disabled:opacity-70 disabled:shadow-none transition-all active:scale-[0.98]"
              >
                {saving ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={22} strokeWidth={2.5} />
                    Save Expense — ₹
                    {amount ? Number(amount).toLocaleString("en-IN") : "0"}
                  </>
                )}
              </button>

              <button
                onClick={handleRetake}
                disabled={saving}
                className="w-full mt-4 h-[56px] bg-transparent text-text-secondary dark:text-gray-400 rounded-card flex items-center justify-center gap-2 font-dm font-semibold text-[15px] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <Camera size={20} />
                Retake Photo
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {scanState === "scanning" && (
          <div className="absolute bottom-12 inset-x-0 flex justify-center items-center gap-12 z-20">
            <button
              onClick={openGallery}
              className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            >
              <ImagePlus size={24} className="text-white" />
            </button>

            <button
              onClick={captureImage}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-transform hover:scale-105 active:scale-95"
            >
              <div className="w-[68px] h-[68px] rounded-full border-[3px] border-black/10 flex items-center justify-center">
                <Camera size={32} className="text-black" strokeWidth={2} />
              </div>
            </button>

            <div className="w-14" />
          </div>
        )}
      </div>
    </>
  );
}