"""
Nusantara Transparan — AI Anomaly Detection Engine
Mematuhi Aturan Arsitektur #4 di GEMINI.md:
- AI hanya beroperasi secara READ-ONLY pada dataset publik/terotorisasi.
- AI dilarang mengubah, menimpa, atau memperbarui catatan resmi anggaran negara.
"""

import json
import math
from typing import List, Dict, Any


class BudgetAnomalyDetector:
    """
    Mesin deteksi pola pengeluaran tidak biasa menggunakan analisis varians serapan,
    rasio progres fisik vs keuangan, dan deteksi pencilan (outlier).
    """

    def __init__(self, low_absorption_threshold: float = 0.75, high_concentration_ratio: float = 0.45):
        self.low_absorption_threshold = low_absorption_threshold
        self.high_concentration_ratio = high_concentration_ratio

    def analyze_records(self, budgets: List[Dict[str, Any]], projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        findings: List[Dict[str, Any]] = []
        idx = 1

        total_expenditure_budget = sum(
            float(b.get("target", 0)) for b in budgets if b.get("type") == "expenditure"
        )

        for b in budgets:
            name = b.get("name", "Item Anggaran")
            target = float(b.get("target", 0))
            real = float(b.get("real", 0))
            if target <= 0:
                continue

            ratio = real / target

            # 1. Deteksi Over-Budget (Realisasi > Pagu)
            if ratio > 1.0:
                findings.append({
                    "id": f"AN-{idx}",
                    "title": f"Realisasi melampaui pagu anggaran pada {name}",
                    "desc": f"Tercatat serapan sebesar {(ratio * 100):.1f}% yang melebihi alokasi pagu awal.",
                    "data": f"Pagu: Rp {target:.0f} T | Realisasi: Rp {real:.0f} T",
                    "priority": "Tinggi",
                    "period": "TA 2026",
                    "rec": "Periksa dokumen APBN-P (Perubahan) atau otorisasi realokasi anggaran.",
                })
                idx += 1

            # 2. Deteksi Serapan Rendah (< 75%)
            elif ratio < self.low_absorption_threshold:
                findings.append({
                    "id": f"AN-{idx}",
                    "title": f"Selisih signifikan antara pagu dan realisasi pada {name}",
                    "desc": f"Serapan anggaran {name} baru mencapai {(ratio * 100):.1f}% dari target/pagu.",
                    "data": f"Pagu: Rp {target:.0f} T | Realisasi: Rp {real:.0f} T (Sisa: Rp {(target - real):.0f} T)",
                    "priority": "Sedang" if ratio < 0.65 else "Rendah",
                    "period": "TA 2026",
                    "rec": "Evaluasi kendala eksekusi program dan potensi penumpukan belanja akhir tahun.",
                })
                idx += 1

            # 3. Deteksi Konsentrasi Pagu Tinggi
            if total_expenditure_budget > 0 and b.get("type") == "expenditure":
                share = target / total_expenditure_budget
                if share >= self.high_concentration_ratio:
                    findings.append({
                        "id": f"AN-{idx}",
                        "title": f"Konsentrasi alokasi belanja dominan pada {name}",
                        "desc": f"Kategori {name} menyerap {(share * 100):.1f}% dari total pagu belanja yang dipantau.",
                        "data": f"Alokasi {name}: Rp {target:.0f} T dari Total Rp {total_expenditure_budget:.0f} T",
                        "priority": "Sedang",
                        "period": "TA 2026",
                        "rec": "Pastikan pengawasan berlapis dan verifikasi bukti transaksi SP2D secara berkala.",
                    })
                    idx += 1

        # 4. Analisis Proyek Pemerintah
        for p in projects:
            p_name = p.get("name", "Proyek")
            p_budget = float(p.get("budget", 0))
            p_spent = float(p.get("spent", 0))
            p_status = p.get("status", "Berjalan")

            if p_status == "Tertunda":
                findings.append({
                    "id": f"AN-{idx}",
                    "title": f"Proyek berstatus Tertunda: {p_name}",
                    "desc": "Proyek mengalami keterlambatan jadwal pelaksanaan fisik.",
                    "data": f"Anggaran: Rp {p_budget:.0f} T | Terpakai: Rp {p_spent:.0f} T",
                    "priority": "Tinggi",
                    "period": "TA 2026",
                    "rec": "Tinjau berita acara lapangan dan kendala kontraktor pelaksana.",
                })
                idx += 1

        return findings


if __name__ == "__main__":
    detector = BudgetAnomalyDetector()
    sample_budgets = [
        {"name": "Pendidikan", "type": "expenditure", "target": 720, "real": 510},
        {"name": "Belanja Pemerintah Pusat", "type": "expenditure", "target": 3100, "real": 2210},
    ]
    res = detector.analyze_records(sample_budgets, [])
    print(json.dumps(res, indent=2, ensure_ascii=False))
