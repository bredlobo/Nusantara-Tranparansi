"""
Nusantara Transparan — Data Pipeline Transformation & Hashing Module
Menormalisasi format angka dan menghasilkan Cryptographic Hash (SHA-256) sebelum disimpan ke PostgreSQL.
"""

import hashlib
from typing import List, Dict, Any


def transform_and_hash(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    transformed = []
    for rec in records:
        name = str(rec.get("name", "")).strip()
        target = round(float(rec.get("target", 0.0)), 2)
        real = round(float(rec.get("real", 0.0)), 2)
        rec_type = str(rec.get("record_type", "budget")).lower()

        payload = f"{rec_type}|{name}|{target:.2f}|{real:.2f}"
        digest = "0x" + hashlib.sha256(payload.encode("utf-8")).hexdigest()

        item = dict(rec)
        item["name"] = name
        item["target"] = target
        item["real"] = real
        item["integrity_hash"] = digest
        item["validation_status"] = "draft"
        transformed.append(item)

    return transformed
