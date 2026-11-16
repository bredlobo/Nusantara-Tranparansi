package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"nusantara-transparan/backend/internal/database"
)

func TestAES256EncryptionDecryption(t *testing.T) {
	original := "Rahasia-Negara-APBN-2026-AES256GCM"
	encrypted, err := EncryptAES256(original)
	if err != nil {
		t.Fatalf("EncryptAES256 gagal: %v", err)
	}
	if encrypted == original {
		t.Fatalf("Ciphertext tidak boleh sama dengan plaintext")
	}

	decrypted, err := DecryptAES256(encrypted)
	if err != nil {
		t.Fatalf("DecryptAES256 gagal: %v", err)
	}
	if decrypted != original {
		t.Fatalf("Hasil dekripsi (%s) tidak cocok dengan plaintext (%s)", decrypted, original)
	}
}

func TestMFATOTPGenerationAndVerification(t *testing.T) {
	secret := "nusantara-admin-mfa-secret"
	code := GenerateMFACode(secret)
	if len(code) != 6 {
		t.Fatalf("Kode MFA harus 6 digit, dapat: %s", code)
	}
	if !VerifyMFACode(secret, code) {
		t.Fatalf("Verifikasi kode MFA valid gagal")
	}
	if VerifyMFACode(secret, "000000") && code != "000000" {
		t.Fatalf("Verifikasi kode MFA palsu seharusnya ditolak")
	}
}

func TestRBACMiddlewareEnforcement(t *testing.T) {
	protectedHandler := RequireRole(false, database.RoleAdmin)(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// 1. Akses oleh Public -> Harus Ditolak (403 Forbidden)
	reqPublic := httptest.NewRequest(http.MethodPost, "/api/v1/admin/publish", nil)
	reqPublic.Header.Set("X-User-Role", "public")
	recPublic := httptest.NewRecorder()
	protectedHandler(recPublic, reqPublic)
	if recPublic.Code != http.StatusForbidden {
		t.Fatalf("Seharusnya 403 Forbidden untuk role public, dapat: %d", recPublic.Code)
	}

	// 2. Akses oleh Admin -> Harus Diizinkan (200 OK)
	reqAdmin := httptest.NewRequest(http.MethodPost, "/api/v1/admin/publish", nil)
	reqAdmin.Header.Set("X-User-Role", "admin")
	recAdmin := httptest.NewRecorder()
	protectedHandler(recAdmin, reqAdmin)
	if recAdmin.Code != http.StatusOK {
		t.Fatalf("Seharusnya 200 OK untuk role admin, dapat: %d", recAdmin.Code)
	}
}

func TestPIIMaskingCompliance(t *testing.T) {
	masked := MaskPII("3201234567890001")
	if masked != "32****01" {
		t.Fatalf("Masking PII tidak sesuai: %s", masked)
	}
}
