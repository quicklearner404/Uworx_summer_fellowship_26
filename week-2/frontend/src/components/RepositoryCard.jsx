import {
    Star,
    GitFork,
    Bug,
    GitBranch,
    Clock,
    Globe,
    ShieldCheck,
    Activity,
} from "lucide-react";

import StatCard from "./StatCard";
import StatusBadge from "./StatusBadge";

export default function RepositoryCard({ repo }) {
    return (
        <article className="rounded-2xl border border-[#30363d] bg-[#161b22] p-8">
            <div className="space-y-5">
                <div className="space-y-3">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                        Repository overview
                    </p>
                    <div className="space-y-1">
                        <h2 className="text-3xl font-semibold text-slate-100">
                            {repo.name}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {repo.owner}/{repo.name}
                        </p>
                    </div>
                    <p className="max-w-3xl text-sm leading-7 text-slate-300">
                        {repo.description}
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <StatCard
                        title="Stars"
                        value={repo.stars.toLocaleString()}
                        icon={<Star size={18} className="text-[#58a6ff]" />}
                    />
                    <StatCard
                        title="Forks"
                        value={repo.forks.toLocaleString()}
                        icon={<GitFork size={18} className="text-[#58a6ff]" />}
                    />
                    <StatCard
                        title="Issues"
                        value={repo.open_issues.toLocaleString()}
                        icon={<Bug size={18} className="text-[#58a6ff]" />}
                    />
                    <StatCard
                        title="Health"
                        value={`${repo.health_score}/100`}
                        icon={<ShieldCheck size={18} className="text-[#58a6ff]" />}
                    />
                </div>

                <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] p-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <Activity size={16} />
                                <span>Language</span>
                            </div>
                            <p className="text-sm text-slate-100">
                                {repo.language ?? "Unknown"}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <GitBranch size={16} />
                                <span>Branch</span>
                            </div>
                            <p className="text-sm text-slate-100">
                                {repo.default_branch}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <Clock size={16} />
                                <span>Updated</span>
                            </div>
                            <p className="text-sm text-slate-100">
                                {new Date(repo.updated_at).toLocaleString()}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <Globe size={16} />
                                <span>Webhook</span>
                            </div>
                            <StatusBadge status={repo.webhook_sent} />
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
