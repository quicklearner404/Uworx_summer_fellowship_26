import { ArrowRight, Search } from "lucide-react";

export default function SearchBar({
    repository,
    setRepository,
    onAnalyze,
    loading,
}) {
    return (
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                        Search repository
                    </p>
                    <p className="mt-1 max-w-2xl text-sm text-slate-400">
                        Enter owner/repository to inspect GitHub activity and status.
                    </p>
                </div>
                <span className="inline-flex items-center rounded-full border border-[#30363d] bg-[#0d1117] px-3 py-1 text-xs uppercase tracking-[0.26em] text-slate-500">
                    stable
                </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="relative w-full">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
                        <Search size={18} />
                    </span>
                    <input
                        type="text"
                        value={repository}
                        onChange={(e) => setRepository(e.target.value)}
                        placeholder="owner/repository"
                        className="w-full rounded-2xl border border-[#30363d] bg-[#0d1117] px-4 py-3 pl-12 text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#58a6ff] focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/20"
                    />
                </div>

                <button
                    onClick={onAnalyze}
                    disabled={loading || !repository.trim()}
                    className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#58a6ff] px-6 text-sm font-semibold text-slate-950 transition hover:bg-[#4490d5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Analyzing..." : "Analyze"}
                    <ArrowRight size={18} className="ml-2" />
                </button>
            </div>
        </div>
    );
}