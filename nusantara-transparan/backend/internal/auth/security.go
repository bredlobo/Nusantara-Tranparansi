package auth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"os"
	"time"
)

// getMasterKey mengambil kunci AES-256 (32 byte) dari environment atau menurunkan dari secret key
func getMasterKey() []byte {
	secret := os.Getenv("APP_ENCRYPTION_KEY")
	if secret == "" {
		secret = "nusantara-transparan-default-aes256-secret-key-2026"
	}
	hash := sha256.Sum256([]byte(secret))
	return hash[:]
}

// EncryptAES256 mengenkripsi data sensitif at-rest menggunakan standar AES-256-GCM (Checklist #1)
func EncryptAES256(plaintext string) (string, error) {
	key := getMasterKey()
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := aesGCM.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptAES256 mendekripsi ciphertext AES-256-GCM kembali ke plaintext
func DecryptAES256(encodedCiphertext string) (string, error) {
	key := getMasterKey()
	data, err := base64.StdEncoding.DecodeString(encodedCiphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := aesGCM.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext terlalu pendek")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// GenerateMFACode menghasilkan kode 6-digit TOTP berbasis waktu (30 detik) untuk Admin/Auditor (Checklist #2)
func GenerateMFACode(userSecret string) string {
	counter := uint64(time.Now().Unix() / 30)
	buf := make([]byte, 8)
	binary.BigEndian.PutUint64(buf, counter)

	mac := hmac.New(sha256.New, []byte(userSecret))
	mac.Write(buf)
	sum := mac.Sum(nil)

	offset := sum[len(sum)-1] & 0xf
	binCode := (int(sum[offset]&0x7f) << 24) |
		(int(sum[offset+1]&0xff) << 16) |
		(int(sum[offset+2]&0xff) << 8) |
		int(sum[offset+3]&0xff)

	otp := binCode % 1000000
	return fmt.Sprintf("%06d", otp)
}

// VerifyMFACode memvalidasi kode 6-digit TOTP MFA dari pengguna
func VerifyMFACode(userSecret, code string) bool {
	if code == "" {
		return false
	}
	expected := GenerateMFACode(userSecret)
	return hmac.Equal([]byte(expected), []byte(code))
}

// MaskPII menyamarkan data identitas pribadi sesuai kepatuhan UU PDP No. 27/2022 (Checklist #9)
func MaskPII(input string) string {
	if len(input) <= 4 {
		return "****"
	}
	return input[:2] + "****" + input[len(input)-2:]
}
