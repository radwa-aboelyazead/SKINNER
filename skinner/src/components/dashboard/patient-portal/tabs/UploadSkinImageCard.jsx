import { useState, useRef, useEffect } from "react";
import {
  Upload,
  Camera,
  Info,
  X,
  Loader2,
  Activity,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/use-file-upload";
import { analysisApi, saveLatestAnalysisId } from "@/services/skinnerApi";
import { adaptAnalysis, extractId } from "@/services/apiAdapters";
import { useTranslation } from "@/context/LanguageContext";

const RESULT_KEY           = "skinner_latest_analysis_result";

export default function UploadSkinImageCard({ onAnalyze, onUploadComplete }) {
  const { t } = useTranslation();
  const maxSizeMB = 10;
  const maxSize = maxSizeMB * 1024 * 1024;
  const [isAnalyzing,     setIsAnalyzing]     = useState(false);
  const [apiError,        setApiError]        = useState("");
  const [showCamera,      setShowCamera]      = useState(false);
  const [cameraError,     setCameraError]     = useState("");
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);

  const [{ files, errors }, { openFileDialog, removeFile, getInputProps, addFiles }] =
    useFileUpload({
      accept: "image/png,image/jpeg,image/jpg,image/heic",
      maxSize,
    });

  const previewUrl = files[0]?.preview || null;

  const tips = [
    t("tip_1"),
    t("tip_2"),
    t("tip_3"),
    t("tip_4"),
    t("tip_5"),
  ];

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.error("Error playing camera stream:", e));
      }
    } catch (err) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera permission or upload a file instead."
          : "Could not open camera. Please upload a file instead."
      );
    }
  };

  const capturePhoto = () => {
    console.log("capturePhoto clicked");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video) {
      alert("Error: Video element not found!");
      return;
    }
    if (!canvas) {
      alert("Error: Canvas element not found!");
      return;
    }

    try {
      const width = video.videoWidth || video.clientWidth || 640;
      const height = video.videoHeight || video.clientHeight || 480;
      console.log(`Capturing photo: ${width}x${height}`);
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        alert("Error: Could not get 2D context!");
        return;
      }
      ctx.drawImage(video, 0, 0, width, height);

      console.log("Calling canvas.toBlob...");
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            alert("Error: canvas.toBlob returned null blob!");
            return;
          }
          console.log(`Blob generated successfully: ${blob.size} bytes`);
          try {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
            console.log("File created, calling addFiles...");
            addFiles([file]);
            console.log("addFiles completed, closing camera...");
            closeCamera();
          } catch (fileErr) {
            alert("Error creating file or adding files: " + fileErr.message);
          }
        },
        "image/jpeg",
        0.95
      );
    } catch (err) {
      alert("Exception in capturePhoto: " + err.message);
    }
  };

  const closeCamera = () => {
    stopCamera();
    setShowCamera(false);
    setCameraError("");
  };

  useEffect(() => {
    if (showCamera) {
      startCamera();
    }
    return () => stopCamera();
  }, [showCamera]);

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handleRemoveImage = () => {
    if (files[0]) removeFile(files[0].id);
  };

  const handleAnalyze = async () => {
    const file = files[0]?.file;
    if (!previewUrl || !(file instanceof File)) return;
    setIsAnalyzing(true);
    setApiError("");
    try {
      const response   = await analysisApi.uploadAndAnalyze(file);
      const analysisId = extractId(response, ["analysis_id"]);
      if (analysisId) saveLatestAnalysisId(analysisId);
      const adapted = adaptAnalysis(response);
      // Attach local preview as fallback image (works even when API URL is blocked by CORS)
      adapted.localImageUrl = previewUrl;
      if (!adapted.imageUrl) adapted.imageUrl = previewUrl;
      // Persist analysis result for the Analysis tab (survives page refresh)
      try {
        localStorage.setItem(RESULT_KEY, JSON.stringify(adapted));
      } catch { /* ignore */ }
      // Persist local history entry
      try {
        const historyKey = "skinner_local_analysis_history";
        const stored = JSON.parse(localStorage.getItem(historyKey) || "[]");
        const entry = {
          id: adapted.id || `${Date.now()}`,
          condition: adapted.condition,
          confidence: adapted.confidence,
          confidenceLevel: adapted.confidenceLevel,
          createdAt: adapted.createdAt || new Date().toISOString(),
          imageUrl: adapted.imageUrl || previewUrl,
          localImageUrl: previewUrl,
        };
        const next = [entry, ...stored.filter((it) => it.id !== entry.id)].slice(0, 10);
        localStorage.setItem(historyKey, JSON.stringify(next));
      } catch { /* ignore */ }
      onAnalyze?.(adapted);
      onUploadComplete?.();
    } catch (error) {
      setApiError(error.message || "Image analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (previewUrl) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
        <div className="mb-5">
          <h2 className="text-[15px] font-medium text-slate-900 dark:text-white">
            {t("saved_image_title")}
          </h2>
          <p className="mt-1 text-[13px] text-gray-500 dark:text-zinc-400">
            {t("saved_image_desc")}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-sm border border-gray-200 bg-gray-50 dark:border-zinc-800">
          <img
            src={previewUrl}
            alt="Uploaded skin area"
            className={`h-[290px] w-full object-cover ${isAnalyzing ? "blur-sm" : ""}`}
          />
          {!isAnalyzing && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-sm transition hover:bg-white dark:bg-zinc-800 dark:text-zinc-200"
              aria-label="Remove uploaded image"
            >
              <X className="size-4" />
            </button>
          )}

          {isAnalyzing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] dark:bg-zinc-950/60">
              <div className="flex flex-col items-center gap-4 rounded-xl bg-white/95 px-8 py-6 shadow-lg dark:bg-zinc-900">
                <div className="relative flex items-center justify-center">
                  <div className="size-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#050316] dark:border-zinc-700 dark:border-t-blue-500" />
                </div>
                <div className="text-center">
                  <p className="text-[15px] font-semibold text-slate-900 dark:text-white">
                    {t("ai_progress_title")}
                  </p>
                  <p className="mt-1.5 text-[13px] text-gray-500 dark:text-zinc-400">
                    {t("ai_progress_desc")}
                    <span className="inline-flex">
                      <span className="animate-[loading-dots_1.4s_infinite_0.2s]">.</span>
                      <span className="animate-[loading-dots_1.4s_infinite_0.4s]">.</span>
                      <span className="animate-[loading-dots_1.4s_infinite_0.6s]">.</span>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {apiError && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:bg-red-950/20 dark:border-red-900/30">{apiError}</div>}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            className="h-9 rounded-md bg-[#050316] text-[13px] text-white hover:bg-[#111026] dark:bg-blue-600 dark:hover:bg-blue-500"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("analyzing")}
              </>
            ) : (
              <>
                <Activity className="size-4" />
                {t("analyze_with_ai")}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-md px-5 text-[13px] dark:border-zinc-800 dark:text-zinc-300"
            onClick={openFileDialog}
            disabled={isAnalyzing}
          >
            <RefreshCcw className="size-4" />
            {t("upload_new_image")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-md px-5 text-[13px] dark:border-zinc-800 dark:text-zinc-300"
            onClick={handleTakePhoto}
            disabled={isAnalyzing}
          >
            <Camera className="size-4" />
            {t("retake_photo")}
          </Button>
        </div>

        {showCamera && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-zinc-800">
                <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">{t("take_photo")}</h3>
                <button
                  type="button"
                  onClick={closeCamera}
                  className="flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="relative bg-black">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && streamRef.current && el.srcObject !== streamRef.current) {
                      el.srcObject = streamRef.current;
                      el.play().catch((e) => console.error("Error playing camera callback:", e));
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="h-[400px] w-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6">
                    <div className="rounded-xl bg-white p-6 text-center shadow-lg dark:bg-zinc-900">
                      <Camera className="mx-auto size-10 text-gray-400" />
                      <p className="mt-3 text-[13px] text-gray-700 dark:text-zinc-300">{cameraError}</p>
                      <Button
                        variant="outline"
                        className="mt-4 h-9 rounded-md text-[13px] dark:border-zinc-800"
                        onClick={closeCamera}
                      >
                        {t("close")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center px-5 py-5">
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!!cameraError}
                  className="flex size-16 items-center justify-center rounded-full border-4 border-gray-300 bg-white text-gray-700 transition hover:border-[#050316] hover:text-[#050316] disabled:opacity-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                >
                  <Camera className="size-7" />
                </button>
              </div>
            </div>
          </div>
        )}

        <input {...getInputProps()} className="sr-only" data-upload-input />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div>
        <h2 className="text-[15px] font-medium text-slate-900 dark:text-white">
          {t("upload_skin_image")}
        </h2>
        <p className="mt-1 text-[13px] text-gray-500 dark:text-zinc-400">
          {t("upload_skin_desc")}
        </p>
      </div>

      <div className="mt-7 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:bg-zinc-950/20 dark:border-zinc-800">
        <div className="mb-3 flex items-center gap-2">
          <Info className="size-4 text-blue-700 dark:text-blue-400" />
          <span className="text-[13px] font-medium text-blue-800 dark:text-blue-300">
            {t("best_results")}
          </span>
        </div>
        <ul className="ml-10 space-y-2 text-[13px] leading-none text-blue-700 dark:text-blue-400 list-disc">
          {tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>

      <input {...getInputProps()} className="sr-only" data-upload-input />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={openFileDialog}
          className="flex min-h-[145px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-7 text-center transition hover:border-blue-300 hover:bg-blue-50/40 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800/40 cursor-pointer"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/60">
            <Upload className="size-6 text-blue-600 dark:text-blue-400" />
          </span>
          <span className="mt-4 text-[14px] font-medium text-slate-700 dark:text-white">
            {t("upload_from_device")}
          </span>
          <span className="mt-2 text-[12px] text-gray-500 dark:text-zinc-400">
            {t("browse_files")}
          </span>
        </button>

        <button
          type="button"
          onClick={handleTakePhoto}
          className="flex min-h-[145px] flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-7 text-center transition hover:border-green-300 hover:bg-green-50/40 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800/40 cursor-pointer"
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/60">
            <Camera className="size-6 text-green-600 dark:text-green-400" />
          </span>
          <span className="mt-4 text-[14px] font-medium text-slate-700 dark:text-white">
            {t("take_photo")}
          </span>
          <span className="mt-2 text-[12px] text-gray-500 dark:text-zinc-400">{t("use_camera")}</span>
        </button>
      </div>

      {errors?.length > 0 && (
        <p className="mt-3 text-center text-xs text-red-500">{errors[0]}</p>
      )}

      <p className="mt-3 text-center text-[11px] text-gray-500 dark:text-zinc-400">
        {t("supported_formats")} {maxSizeMB}MB
      </p>

      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-zinc-800">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-white">{t("take_photo")}</h3>
              <button
                type="button"
                onClick={closeCamera}
                className="flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="relative bg-black">
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && streamRef.current && el.srcObject !== streamRef.current) {
                    el.srcObject = streamRef.current;
                    el.play().catch((e) => console.error("Error playing camera callback:", e));
                  }
                }}
                autoPlay
                playsInline
                muted
                className="h-[400px] w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6">
                  <div className="rounded-xl bg-white p-6 text-center shadow-lg dark:bg-zinc-900">
                    <Camera className="mx-auto size-10 text-gray-400" />
                    <p className="mt-3 text-[13px] text-gray-700 dark:text-zinc-300">{cameraError}</p>
                    <Button
                      variant="outline"
                      className="mt-4 h-9 rounded-md text-[13px] dark:border-zinc-800"
                      onClick={closeCamera}
                    >
                      {t("close")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-center px-5 py-5">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!!cameraError}
                className="flex size-16 items-center justify-center rounded-full border-4 border-gray-300 bg-white text-gray-700 transition hover:border-[#050316] hover:text-[#050316] disabled:opacity-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              >
                <Camera className="size-7" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
