export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-24 text-center">
      <h1 className="font-display text-6xl font-bold uppercase mb-6 tracking-tight">
        Zaf Autos Japan
      </h1>
      <p className="text-muted-foreground max-w-2xl text-lg mb-8">
        Imported. Inspected. Ready. The enterprise-grade automotive marketplace for Japanese imported vehicles.
      </p>
      <div className="flex gap-4">
        <button className="bg-primary text-primary-foreground px-7 py-3.5 rounded-md font-medium uppercase text-sm tracking-wide hover:bg-destructive transition-colors">
          View Inventory
        </button>
      </div>
    </main>
  );
}
