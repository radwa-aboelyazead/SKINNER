export default function Footer() {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0f172a] py-7">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-[14px] leading-6 text-gray-600">
          <span className="font-semibold text-gray-700">Medical Disclaimer:</span>{" "}
          Skin Disease Detection System is designed to assist in skin condition
          identification but should not replace professional medical advice,
          diagnosis, or treatment.
        </p>

        <p className="mt-3 text-[14px] leading-6 text-gray-600">
          Always seek the advice of your physician or other qualified health
          provider with any questions regarding a medical condition.
        </p>

        <p className="mt-3 text-[12px] text-gray-400">
          © 2024 Skin Disease Detection System. HIPAA Compliant Healthcare Platform.
        </p>
      </div>
    </footer>
  );
}