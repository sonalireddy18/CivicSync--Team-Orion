export default function PublicWorksMap() {
  return (
    <div className="flex h-[70vh] min-h-[420px] w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100">
      <div className="text-center">
        <p className="text-4xl">🗺️</p>
        <p className="mt-3 text-lg font-semibold text-slate-700">
          Public Works Map
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Map will be added here (Leaflet integration coming soon)
        </p>
      </div>
    </div>
  );
}
