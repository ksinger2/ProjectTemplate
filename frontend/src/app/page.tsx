export default function Home() {
  return (
    <main className="min-h-screen bg-bb-background text-white flex flex-col items-center justify-center p-8">
      {/* Blockbuster Video-inspired logo area */}
      <div className="relative mb-8">
        {/* Torn ticket shape background */}
        <div className="bg-bb-blue rounded-lg px-10 py-6 shadow-2xl border-2 border-bb-accent/30">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-bb-accent">
            BLOCKBUSTER
          </h1>
        </div>
      </div>

      <p className="text-xl text-bb-accent font-semibold mb-2">
        Your Personal Video Store
      </p>
      <p className="text-gray-400 text-sm">
        Be Kind, Rewind.
      </p>

      {/* Quick status */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-surface rounded-lg p-6 border border-white/10">
          <p className="text-3xl font-bold text-bb-accent">Movies</p>
          <p className="text-gray-400 text-sm mt-1">Drop files in /media/movies</p>
        </div>
        <div className="bg-surface rounded-lg p-6 border border-white/10">
          <p className="text-3xl font-bold text-bb-accent">TV Shows</p>
          <p className="text-gray-400 text-sm mt-1">Drop files in /media/shows</p>
        </div>
        <div className="bg-surface rounded-lg p-6 border border-white/10">
          <p className="text-3xl font-bold text-bb-accent">Music</p>
          <p className="text-gray-400 text-sm mt-1">Drop files in /media/music</p>
        </div>
      </div>
    </main>
  );
}
