package database

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Global DB instance
var DB *gorm.DB

// InitDB menginisialisasi koneksi GORM ke PostgreSQL
func InitDB() (*gorm.DB, error) {
	_ = godotenv.Load() // Muat .env jika ada

	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "nusantara_transparan")
	sslmode := getEnv("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Jakarta",
		host, user, password, dbname, port, sslmode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("gagal terhubung ke database PostgreSQL: %w", err)
	}

	DB = db
	log.Println("✅ Berhasil terhubung ke database PostgreSQL via GORM.")
	return db, nil
}

// AutoMigrate mengeksekusi migrasi otomatis untuk seluruh entitas sistem
func AutoMigrate(db *gorm.DB) error {
	log.Println("🔄 Memulai AutoMigrate GORM...")

	err := db.AutoMigrate(
		&User{},
		&Ministry{},
		&Budget{},
		&Realization{},
		&Transaction{},
		&Project{},
		&BlockchainRecord{},
		&AuditLog{},
		&AnomalyFinding{},
	)
	if err != nil {
		return fmt.Errorf("gagal melakukan automigrate: %w", err)
	}

	log.Println("✅ AutoMigrate selesai. Semua tabel dan indeks berhasil dipasang.")
	return nil
}

func getEnv(key, fallback string) string {
	if val, exists := os.LookupEnv(key); exists && val != "" {
		return val
	}
	return fallback
}
