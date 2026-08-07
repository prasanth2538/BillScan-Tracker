import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { parseWithOwnAI } from "../ai/BillParser";
import { OCRService } from "../services/OCRService";
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

declare global {
  interface Window {
    onMLKitResult?: (text: string) => void;
    onMLKitError?: () => void;
    AndroidBridge?: {
      scanBill?: (imageData: string) => void;
      toggleTorch?: (enable: boolean) => void;
      toggleFlash?: (enable: boolean) => void;
    };
  }
}

interface ScanScreenProps {
  onClose: () => void;
  onSave: (amount?: number, category?: string, merchant?: string) => void;
}

const CATEGORIES = [
  { label: "Food", emoji: "🍽️" },
  { label: "Grocery", emoji: "🛒" },
  { label: "Petrol", emoji: "⛽" },
  { label: "Travel", emoji: "🚌" },
  { label: "Hotel", emoji: "🏨" },
  { label: "Health", emoji: "🏥" },
  { label: "Shopping", emoji: "🛍️" },
  { label: "Entertainment", emoji: "🎬" },
  { label: "Education", emoji: "🎓" },
  { label: "Bills", emoji: "💡" },
  { label: "Other", emoji: "📄" },
];

const CAT_META: Record<string, { icon: string; color: string }> = {
  Food: { icon: "🍽️", color: "#FFF8EE" },
  Grocery: { icon: "🛒", color: "#F0FAF5" },
  Petrol: { icon: "⛽", color: "#EDF4FD" },
  Travel: { icon: "🚌", color: "#F0FDF4" },
  Hotel: { icon: "🏨", color: "#FFF7ED" },
  Health: { icon: "🏥", color: "#FEF2F2" },
  Shopping: { icon: "🛍️", color: "#FDF2F8" },
  Entertainment: { icon: "🎬", color: "#F3F0FD" },
  Education: { icon: "🎓", color: "#EFF6FF" },
  Bills: { icon: "💡", color: "#FEFCE8" },
  Other: { icon: "📄", color: "#F5F5F5" },
};

export function ScanScreen({ onClose, onSave }: ScanScreenProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [scanState, setScanState] = useState<
    "scanning" | "processing" | "detected"
  >("scanning");

  const [processingMessage, setProcessingMessage] = useState("Uploading...");

  const [flashOn, setFlashOn] = useState(false);
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

    window.onMLKitResult = (text: string) => {
      processScannedText(text);
    };

    window.onMLKitError = () => {
      setCameraError("Could not read text clearly. Please try again.");
      setScanState("scanning");
    };

    return () => {
      stopCamera();
      delete window.onMLKitResult;
      delete window.onMLKitError;
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Camera access denied. Use gallery option.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const toggleFlash = async () => {
    const nextState = !flashOn;
    setFlashOn(nextState);

    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as { torch?: boolean };
          if ("torch" in capabilities || capabilities.torch) {
            await track.applyConstraints({
              advanced: [{ torch: nextState } as unknown as MediaTrackConstraintSet],
            });
          }
        } catch (err) {
          console.warn("Hardware torch control error:", err);
        }
      }
    }

    if (window.AndroidBridge?.toggleTorch) {
      window.AndroidBridge.toggleTorch(nextState);
    } else if (window.AndroidBridge?.toggleFlash) {
      window.AndroidBridge.toggleFlash(nextState);
    }
  };

  const processFileWithBackend = async (file: File) => {
    if (scanState === "processing") return;

    setScanState("processing");
    setProcessingMessage("Scanning image...");
    setCameraError("");

    try {
      setProcessingMessage("Scanning image...");

      const result = await OCRService.uploadAndExtractText(file);
      processScannedText(
        result.text,
        result.confidence,
        result.amount,
        result.merchant
      );
    } catch (err: unknown) {
      console.error("PaddleOCR backend failed:", err);
      const msg =
        err instanceof Error
          ? err.message
          : "OCR failed. Please try a clearer image.";
      setCameraError(msg);
      setScanState("scanning");
    }
  };

  const processScannedText = (
    text: string,
    serverConfidence?: number,
    serverAmount?: number,
    serverMerchant?: string
  ) => {
    console.log("OCR TEXT:", text);
    setRawOCRText(text);

    const parsed = parseWithOwnAI(text);

    const finalAmount =
      parsed.amount > 0
        ? parsed.amount
        : serverAmount && serverAmount > 0
        ? serverAmount
        : 0;

    const finalMerchant =
      parsed.merchant && parsed.merchant !== "Unknown Merchant"
        ? parsed.merchant
        : serverMerchant || "Unknown Merchant";

    setAmount(finalAmount > 0 ? String(finalAmount) : "");
    setMerchant(finalMerchant);
    setCategory(parsed.category || "Other");
    setConfidence(
      serverConfidence && serverConfidence > 0
        ? serverConfidence
        : finalAmount > 0
        ? 90
        : 0
    );

    setScanState("detected");
  };

  const captureImage = () => {
    if (!videoRef.current || scanState === "processing") return;

    setCameraError("");

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;

    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    if (window.AndroidBridge?.scanBill) {
      setScanState("processing");
      setProcessingMessage("Reading bill...");
      window.AndroidBridge.scanBill(imageData);
    } else {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setCameraError("Failed to capture image. Please try again.");
          return;
        }
        const file = new File([blob], "captured_bill.jpg", {
          type: "image/jpeg",
        });
        await processFileWithBackend(file);
      }, "image/jpeg", 0.9);
    }
  };

  const openGallery = () => {
    if (scanState === "processing") return;
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file || scanState === "processing") return;

    setCameraError("");

    if (window.AndroidBridge?.scanBill) {
      setScanState("processing");
      setProcessingMessage("Reading bill...");

      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        if (window.AndroidBridge?.scanBill) {
          window.AndroidBridge.scanBill(imageData);
        }
      };
      reader.readAsDataURL(file);
    } else {
      await processFileWithBackend(file);
    }

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
        rawOCRText,
        ocrText: rawOCRText,
      });

      stopCamera();
      onSave(numAmount, category, merchant || "Unknown Merchant");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save expense";
      setSaveError(msg);
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
        disabled={scanState === "processing"}
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

        <div className="absolute top-0 w-full flex justify-between items-center px-5 pt-12 pb-4 z-20">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center"
          >
            <X size={20} className="text-white" />
          </button>

          <span className="font-semibold text-white text-lg">Scan Bill</span>

          <button
            onClick={toggleFlash}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              flashOn ? "bg-yellow-400" : "bg-black/50"
            }`}
          >
            {flashOn ? (
              <Zap size={20} className="text-black" />
            ) : (
              <ZapOff size={20} className="text-white" />
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
            <div className="w-80 h-52 border-2 border-white/60 rounded-2xl relative">
              <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg" />
            </div>
          </div>
        )}

        {scanState === "processing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white text-lg">{processingMessage}</p>
          </div>
        )}

        <AnimatePresence>
          {scanState === "detected" && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute bottom-0 w-full bg-white dark:bg-gray-900 rounded-t-3xl z-30 px-6 pt-6 pb-10 max-h-[85%] overflow-y-auto"
            >
              <div className="w-11 h-1 bg-gray-300 rounded-full mx-auto mb-6" />

              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                    Merchant
                  </p>

                  <input
                    value={merchant}
                    onChange={(e) => setMerchant(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                    className="w-full text-xl font-medium border-b pb-1 focus:outline-none bg-transparent text-gray-900 dark:text-white"
                    placeholder="Enter merchant name"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                    Amount
                  </p>

                  <div className="flex items-center gap-3">
                    {isEditingAmount ? (
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        onBlur={() => setIsEditingAmount(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            setIsEditingAmount(false);
                            handleSave();
                          }
                        }}
                        autoFocus
                        className="text-5xl font-bold w-full focus:outline-none border-b-2 border-green-600 bg-transparent text-gray-900 dark:text-white"
                      />
                    ) : (
                      <h2 className="text-5xl font-bold text-gray-900 dark:text-white">
                        ₹{amount ? Number(amount).toLocaleString("en-IN") : "0"}
                      </h2>
                    )}

                    <button
                      onClick={() => setIsEditingAmount((v) => !v)}
                      className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full flex-shrink-0 text-gray-900 dark:text-white"
                    >
                      <Edit2 size={18} />
                    </button>
                  </div>

                  {confidence > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Confidence: {confidence}%
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">
                    Category
                  </p>

                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.label}
                        onClick={() => setCategory(cat.label)}
                        className={`px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                          category === cat.label
                            ? "bg-green-600 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {rawOCRText && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                    Raw OCR Debug
                  </p>
                  <pre className="p-3 bg-white dark:bg-gray-900 rounded-xl text-xs text-gray-600 dark:text-gray-300 max-h-32 overflow-y-auto whitespace-pre-wrap border border-gray-100 dark:border-gray-800">
                    {rawOCRText}
                  </pre>
                </div>
              )}

              {saveError && (
                <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  <span>{saveError}</span>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !amount || Number(amount) <= 0}
                className="w-full mt-8 h-14 bg-green-600 text-white rounded-2xl flex items-center justify-center gap-2 text-lg font-medium disabled:opacity-70"
              >
                {saving ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={22} />
                    Save Expense — ₹
                    {amount ? Number(amount).toLocaleString("en-IN") : "0"}
                  </>
                )}
              </button>

              <button
                onClick={handleRetake}
                disabled={saving}
                className="w-full mt-3 h-12 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl flex items-center justify-center gap-2 font-medium"
              >
                <Camera size={20} />
                Retake Photo
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {scanState === "scanning" && (
          <div className="absolute bottom-12 inset-x-0 flex justify-center gap-12 z-20">
            <button
              onClick={openGallery}
              className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
            >
              <ImagePlus size={28} className="text-white" />
            </button>

            <button
              onClick={captureImage}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl"
            >
              <Camera size={36} className="text-black" />
            </button>

            <div className="w-14" />
          </div>
        )}
      </div>
    </>
  );
}