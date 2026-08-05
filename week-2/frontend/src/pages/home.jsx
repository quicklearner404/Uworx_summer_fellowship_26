import { useState } from "react";

import SearchBar from "../components/SearchBar";
import RepositoryCard from "../components/RepositoryCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { analyzeRepository } from "../api/githubApi";

export default function Home() {
    const [repository, setRepository] = useState("");
    const [repo, setRepo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleAnalyze() {
        // Don't send empty requests
        if (!repository.trim()) return;

        setLoading(true);
        setError("");
        setRepo(null);

        try {
            const data = await analyzeRepository(repository.trim());

            setRepo(data);
        } catch (err) {
            console.error(err);

            if (err.response?.status === 404) {
                setError(
                    "Repository not found. Try something like microsoft/vscode."
                );
            } else if (err.response?.status === 403) {
                setError(
                    "GitHub API rate limit exceeded. Please try again later."
                );
            } else {
                setError(
                    "Something went wrong while analyzing the repository."
                );
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#0d1117] text-slate-100">
            <div className="mx-auto max-w-6xl px-6 py-8">
                <h1 className="mb-8 text-5xl font-bold text-slate-100" >
                    GitHub Repository Explorer
                </h1>

                <SearchBar
                    repository={repository}
                    setRepository={setRepository}
                    onAnalyze={handleAnalyze}
                    loading={loading}
                />

                {error && (
                    <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
                        <p className="font-semibold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {loading && <LoadingSpinner />}

                {!loading && repo && (
                    <div className="mt-10">
                        <RepositoryCard repo={repo} />
                    </div>
                )}
            </div>
        </div>
    );
}