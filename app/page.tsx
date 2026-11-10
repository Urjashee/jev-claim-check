"use client";

import {useMemo, useState, type FormEvent} from "react";
import {ArrowUpRight, ClipboardCheck, FileText, LoaderCircle, ShieldCheck} from "lucide-react";

import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {extractClaims} from "@/lib/claims";
import {processClaims} from "./actions";

type Analysis = Awaited<ReturnType<typeof processClaims>>;

const initialDescription = `Daily support for a calmer, more restful night. Helps you fall asleep faster and wake feeling refreshed.\n\n• Promotes deep, uninterrupted sleep\n• Supports relaxation and a balanced mood\n• Non-habit forming botanical blend`;

function formatLabel(value: string) {
    return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Home() {
    const [description, setDescription] = useState(initialDescription);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState("");
    const claims = useMemo(() => extractClaims(description), [description]);

    async function onAnalyze(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setAnalysis(null);
        if (claims.length === 0) {
            setError("Enter a product description to begin the assessment.");
            return;
        }

        setIsAnalyzing(true);
        try {
            setAnalysis(await processClaims(claims));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "The assessment could not be completed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    }

    const elevatedRisks = analysis?.results.filter((result) => result.riskScore >= 2).length ?? 0;
    const diseaseClaims = analysis?.results.filter((result) => result.diseaseLikelihood >= 0.5).length ?? 0;

    return (
        <main className="min-h-screen bg-slate-50 px-5 py-8 text-slate-900 sm:px-8 sm:py-12">
            <div className="mx-auto max-w-5xl">
                <header className="mb-8 flex items-center justify-between border-b border-slate-200 pb-5">
                    <a href="#top" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white"><ShieldCheck size={17} /></span>
                        JEV <span className="font-normal text-slate-400">/ Claims review</span>
                    </a>
                    <span className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><span className="size-1.5 rounded-full bg-emerald-500" /> AI-assisted screening</span>
                </header>

                <section id="top" className="mb-8 max-w-2xl">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Product compliance · Report</p>
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Claims assessment</h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Review the language in your product description for potential health and efficacy claims.</p>
                </section>

                <form onSubmit={onAnalyze} className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                            <label htmlFor="product-description" className="text-sm font-semibold">Product description</label>
                            <p className="mt-1 text-xs text-slate-500">Paste the full listing. Bullets and sentences are assessed separately.</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs tabular-nums text-slate-600">{claims.length} claims found</span>
                    </div>
                    <Textarea
                        id="product-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={7}
                        placeholder="Paste a product description, including bullets..."
                        className="min-h-40 resize-y border-slate-200 bg-slate-50/70 text-sm leading-6 focus-visible:bg-white"
                    />
                    <div className="mt-4 flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
                        <p className="max-w-xl text-xs leading-5 text-slate-500">For screening purposes only. Results are not legal advice or a substitute for regulatory review.</p>
                        <Button type="submit" disabled={isAnalyzing || claims.length === 0} className="h-10 gap-2 rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-700">
                            {isAnalyzing ? <LoaderCircle size={15} className="animate-spin" /> : <ArrowUpRight size={15} />}
                            {isAnalyzing ? "Analyzing…" : "Generate report"}
                        </Button>
                    </div>
                    {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                </form>

                {analysis ? (
                    <section aria-labelledby="report-title" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><ClipboardCheck size={18} /></span>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Analysis report</p>
                                        <h2 id="report-title" className="mt-1 text-lg font-semibold tracking-tight">Assessment summary</h2>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">Powered by {analysis.model}</p>
                            </div>
                            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <SummaryMetric label="Claims reviewed" value={analysis.results.length} detail="Statements identified" />
                                <SummaryMetric label="Needs review" value={elevatedRisks} detail="Moderate or higher risk" />
                                <SummaryMetric label="Disease signals" value={diseaseClaims} detail="Potential disease-related language" />
                            </div>
                        </div>

                        <div className="px-5 sm:px-7">
                            <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px] gap-4 border-b border-slate-100 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:grid">
                                <span>Statement</span><span>Claim category</span><span>Risk level</span>
                            </div>
                            <ol className="divide-y divide-slate-100">
                                {analysis.results.map((result, index) => (
                                    <li key={`${result.claim}-${index}`} className="grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:items-start sm:gap-4">
                                        <div className="flex gap-3">
                                            <span className="mt-0.5 w-6 shrink-0 font-mono text-xs text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                                            <p className="text-sm leading-6 text-slate-800">{result.claim}</p>
                                        </div>
                                        <div className="pl-9 sm:pl-0">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:hidden">Claim category</span>
                                            <p className="mt-1 text-sm text-slate-700 sm:mt-0">{formatLabel(result.claimType)}</p>
                                            <p className="mt-1 text-xs text-slate-400">Disease signal: {Math.round(result.diseaseLikelihood * 100)}%</p>
                                            <p className="mt-1 text-xs text-slate-400">Classification confidence: {Math.round(result.claimTypeConfidence * 100)}%</p>
                                        </div>
                                        <div className="flex items-center justify-between pl-9 sm:block sm:pl-0">
                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:hidden">Risk level</span>
                                            <div className="text-right sm:text-left">
                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${riskTone(result.riskScore)}`}>{result.riskLabel}</span>
                                                <p className="mt-1 text-xs text-slate-400">Score {result.riskScore.toFixed(1)}/4 · confidence {Math.round(result.riskConfidence * 100)}%</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <footer className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-4 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                            <span className="flex items-center gap-2"><FileText size={14} /> Screening assessment · Confirm with a qualified reviewer.</span>
                            <span>{analysis.usage.input_tokens ?? "—"} input tokens · {analysis.usage.output_tokens ?? "—"} output tokens</span>
                        </footer>
                    </section>
                ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-dashed border-slate-300 px-5 py-5 text-sm text-slate-500">
                        <FileText size={17} className="mt-0.5 shrink-0" />
                        <p>Your JEV findings will appear here as a structured report after analysis.</p>
                    </div>
                )}
                <p className="mt-7 text-center text-[11px] text-slate-400">JEV · Product claims screening</p>
            </div>
        </main>
    );
}

function SummaryMetric({label, value, detail}: {label: string; value: number; detail: string}) {
    return <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-4 py-3">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-slate-900">{value}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">{detail}</p>
    </div>;
}

function riskTone(score: number) {
    if (score >= 3) return "bg-red-50 text-red-700";
    if (score >= 2) return "bg-amber-50 text-amber-800";
    if (score >= 1) return "bg-sky-50 text-sky-700";
    return "bg-emerald-50 text-emerald-700";
}
