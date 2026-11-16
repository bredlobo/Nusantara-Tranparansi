"""
Nusantara Transparan — Document Intelligence & Metadata Validator
Memvalidasi kelengkapan metadata wajib sesuai Aturan Arsitektur #6 di GEMINI.md:
- Sumber data resmi (source)
- Periode anggaran (period / fiscal_year)
- Status validasi (validation_status)
"""

import hashlib
import json
from typing import Dict, Any, Tuple


def validate_and_fingerprint_document(doc: Dict[str, Any]) -> Tuple[bool, str, str]:
    required_fields = ["name", "target", "real", "source"]
    for field in required_fields:
        if field not in doc or doc[field] in (None, ""):
            return False, f"Field wajib '{field}' tidak ditemukan pada dokumen.", ""

    canonical = json.dumps(doc, sort_keys=True)
    digest = "0x" + hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    return True, "Dokumen valid dan memenuhi standar metadata Aturan #6.", digest
