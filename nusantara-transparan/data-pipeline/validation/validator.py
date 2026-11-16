"""
Nusantara Transparan — Data Pipeline Validation Module
Memvalidasi skema data anggaran & proyek sebelum masuk ke tahap transformasi dan database PostgreSQL.
"""

from typing import List, Dict, Any, Tuple


def validate_batch(records: List[Dict[str, Any]]) -> Tuple[bool, List[str]]:
    errors: List[str] = []
    for idx, rec in enumerate(records):
        name = rec.get("name")
        target = rec.get("target")
        real = rec.get("real")

        if not name or not str(name).strip():
            errors.append(f"Baris {idx + 1}: Nama anggaran/proyek kosong.")
        try:
            t_val = float(target)
            r_val = float(real)
            if t_val < 0 or r_val < 0:
                errors.append(f"Baris {idx + 1} ({name}): Nilai pagu/realisasi tidak boleh negatif.")
        except (TypeError, ValueError):
            errors.append(f"Baris {idx + 1} ({name}): Target dan realisasi harus berupa angka.")

    return len(errors) == 0, errors
