import { Loader2 } from "lucide-react"

export default function WorkspaceRoomLoading() {
  return (
    <div className="flex h-screen w-screen flex-col bg-[#080809] text-[#f0f0f4] overflow-hidden">
      {/* Top Navbar Skeleton */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#2a2a30] bg-[#111114]/85 px-4 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="h-6 w-20 animate-pulse rounded-lg bg-[#2a2a30]" />
          <div className="h-4 w-px bg-[#2a2a30] hidden sm:block" />
          {/* Project Title Placeholder */}
          <div className="h-5 w-32 animate-pulse rounded-md bg-[#2a2a30] hidden sm:block" />
        </div>
        
        {/* Right Nav buttons */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-16 animate-pulse rounded-lg bg-[#2a2a30]" />
          <div className="h-8 w-16 animate-pulse rounded-lg bg-[#2a2a30]" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-[#2a2a30]" />
        </div>
      </header>

      {/* Main Workspace Layout Skeleton */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Left Sidebar Skeleton (Project List) */}
        <aside className="hidden md:flex flex-col w-72 shrink-0 border-r border-[#2a2a30] bg-[#111114]/70 p-4 space-y-4">
          <div className="h-5 w-24 animate-pulse rounded-md bg-[#2a2a30]" />
          <div className="h-8 w-full animate-pulse rounded-lg bg-[#2a2a30]" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-2 h-9 px-2 rounded-xl border border-transparent bg-[#111114]/30 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-[#2a2a30]" />
                <div className="h-3 w-32 rounded bg-[#2a2a30]" />
              </div>
            ))}
          </div>
        </aside>

        {/* Central Canvas Workspace Area */}
        <main className="flex-1 relative flex items-center justify-center p-6 bg-[#080809]">
          {/* Canvas Dot Grid Background Preview */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" 
               style={{ 
                 backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", 
                 backgroundSize: "24px 24px" 
               }} 
          />
          
          {/* Cyan glow centered in canvas */}
          <div className="absolute w-[400px] h-[400px] rounded-full bg-[#00c8d4]/5 blur-[100px] pointer-events-none" />

          {/* Loading status card */}
          <div className="z-10 flex flex-col items-center p-6 rounded-2xl border border-[#2a2a30] bg-[#111114]/90 backdrop-blur-xl max-w-sm w-full text-center space-y-4 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="relative flex items-center justify-center h-12 w-12 rounded-xl border border-[#2a2a30] bg-[#111114]">
              <Loader2 className="h-6 w-6 animate-spin text-[#00c8d4]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#f0f0f4]">Connecting to Liveblocks...</p>
              <p className="text-xs text-[#808090]">Synchronizing collaborative canvas state</p>
            </div>
          </div>
        </main>

        {/* Right AI Sidebar Skeleton */}
        <aside className="hidden lg:flex flex-col w-96 shrink-0 border-l border-[#2a2a30] bg-[#111114]/70 p-4 space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-5 w-28 animate-pulse rounded-md bg-[#2a2a30]" />
            <div className="h-6 w-6 animate-pulse rounded-md bg-[#2a2a30]" />
          </div>
          <div className="flex gap-2 border-b border-[#2a2a30] pb-2">
            <div className="h-8 w-24 animate-pulse rounded bg-[#2a2a30]" />
            <div className="h-8 w-24 animate-pulse rounded bg-[#2a2a30]" />
          </div>
          <div className="flex-1 flex items-center justify-center border border-dashed border-[#2a2a30] rounded-xl bg-[#111114]/20">
            <div className="h-4 w-36 animate-pulse rounded bg-[#2a2a30]" />
          </div>
        </aside>
      </div>
    </div>
  )
}
