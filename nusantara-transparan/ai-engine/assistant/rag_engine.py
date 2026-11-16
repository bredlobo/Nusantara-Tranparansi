"""
Nusantara Transparan — AI Financial Assistant (Retrieval-Augmented Generation / RAG)
Mematuhi Aturan Arsitektur #4 di GEMINI.md:
- Hanya membaca data publik yang telah dipublikasikan (Read-Only).
- Tidak pernah mengarang angka (Zero Hallucination Policy).
"""

from typing import List, Dict, Any


def retrieve_and_answer(question: str, budgets: List[Dict[str, Any]], projects: List[Dict[str, Any]]) -> Dict[str, Any]:
    q = question.lower().strip()
    sources: List[str] = []

    for b in budgets:
        name = str(b.get("name", ""))
        if name.lower() in q:
            target = float(b.get("target", 0))
            real = float(b.get("real", 0))
            pct = (real / target * 100.0) if target > 0 else 0.0
            src = str(b.get("source", "Database PostgreSQL Nusantara Transparan"))
            return {
                "answer": f"Berdasarkan data terverifikasi, pagu anggaran {name} adalah Rp {target:.0f} Triliun dengan realisasi sebesar Rp {real:.0f} Triliun ({pct:.1f}%).",
                "sources": [src],
            }

    for p in projects:
        p_name = str(p.get("name", ""))
        if p_name.lower() in q:
            budget = float(p.get("budget", 0))
            spent = float(p.get("spent", 0))
            prog = float(p.get("progress", 0))
            src = str(p.get("source", "Sistem Monitoring Pengadaan Nasional"))
            return {
                "answer": f"Proyek '{p_name}' memiliki anggaran Rp {budget:.0f} T, serapan Rp {spent:.0f} T, dengan progres fisik {prog:.0f}% (Status: {p.get('status')}).",
                "sources": [src],
            }

    return {
        "answer": "Saya hanya menjawab berdasarkan data resmi yang telah dipublikasikan di database PostgreSQL Nusantara Transparan.",
        "sources": sources,
    }
