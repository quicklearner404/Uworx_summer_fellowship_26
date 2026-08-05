import React from "react";

export default function StatCard({ icon, title, value }) {
    return (
        <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-400">
                    {icon}
                    <span>{title}</span>
                </div>
                <p className="text-xl font-semibold text-slate-100">{value}</p>
            </div>
        </div>
    );
}