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

// InitDB menginisialisasi koneksi GORM ke PostgreSQL (dan otomatis membuat DB jika belum ada)
func InitDB() (*gorm.DB, error) {
	_ = godotenv.Load() // Muat .env jika ada

	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname := getEnv("DB_NAME", "nusantara_transparan")
	sslmode := getEnv("DB_SSLMODE", "disable")

	// 1. Pastikan database sudah ada di PostgreSQL, jika belum ada, buatkan otomatis
	if err := ensureDatabaseExists(host, port, user, password, dbname, sslmode); err != nil {
		log.Printf("⚠️ Gagal verifikasi pembuatan database otomatis: %v (mencoba langsung konek...)", err)
	}

	// 2. Hubungkan ke database nusantara_transparan
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

// ensureDatabaseExists memeriksa apakah database target sudah ada di server PostgreSQL.
// Jika belum, fungsi ini akan membuat database tersebut secara otomatis via database 'postgres'.
func ensureDatabaseExists(host, port, user, password, dbname, sslmode string) error {
	defaultDSN := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=postgres port=%s sslmode=%s TimeZone=Asia/Jakarta",
		host, user, password, port, sslmode,
	)

	db, err := gorm.Open(postgres.Open(defaultDSN), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return err
	}

	var count int
	checkQuery := fmt.Sprintf("SELECT count(*) FROM pg_database WHERE datname = '%s'", dbname)
	if err := db.Raw(checkQuery).Scan(&count).Error; err != nil {
		return err
	}

	if count == 0 {
		log.Printf("📦 Database '%s' belum ada di PostgreSQL. Membuat otomatis...", dbname)
		createQuery := fmt.Sprintf("CREATE DATABASE %s", dbname)
		if err := db.Exec(createQuery).Error; err != nil {
			return err
		}
		log.Printf("✅ Database '%s' berhasil dibuat otomatis!", dbname)
	}

	sqlDB, err := db.DB()
	if err == nil {
		_ = sqlDB.Close()
	}
	return nil
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
