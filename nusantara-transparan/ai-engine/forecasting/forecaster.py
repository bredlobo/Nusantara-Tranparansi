"""
Nusantara Transparan — AI Budget Absorption Forecasting Engine
Memproyeksikan tren realisasi bulanan dan estimasi serapan akhir tahun anggaran (Read-Only).
"""

from typing import List, Dict, Any


def forecast_monthly_absorption(total_budget: float, current_realization: float) -> List[Dict[str, Any]]:
    months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    if total_budget <= 0 and current_realization <= 0:
        return [{"m": m, "budget": 0, "spend": 0, "aktual": 0, "prakiraan": 0} for m in months]

    monthly_budget = round(total_budget / 12.0, 2)
    monthly_actual = round(current_realization / 12.0, 2)

    result = []
    for i, m in enumerate(months):
        # Bulan Jan-Okt aktual, Okt-Des prakiraan akselerasi akhir tahun
        seasonal_factor = 0.85 + (i * 0.03)
        est_spend = round(monthly_actual * seasonal_factor, 2)
        row: Dict[str, Any] = {
            "m": m,
            "budget": monthly_budget,
            "spend": est_spend,
        }
        if i <= 9:
            row["aktual"] = est_spend
        if i >= 9:
            row["prakiraan"] = round(est_spend * (1.0 + (i - 9) * 0.06), 2)
        result.append(row)

    return result
