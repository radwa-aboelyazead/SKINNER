export default function PlaceholderImage({ label = "No image available", className = "h-[100px] w-full rounded-md bg-gray-100 text-sm text-gray-500" }) {
  return (
    <div className={className}>
      <div className="flex h-full w-full items-center justify-center text-center px-3">
        <span>{label}</span>
      </div>
    </div>
  );
}
