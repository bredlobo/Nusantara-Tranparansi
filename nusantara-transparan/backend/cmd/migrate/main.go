package main

import (
	"flag"
	"log"

	"nusantara-transparan/backend/internal/database"
)

func main() {
	seedFlag := flag.Bool("seed", false, "Isi data awal (seed) setelah migrasi")
	flag.Parse()

	log.Println("==================================================")
	log.Println("  NUSANTARA TRANSPARAN — DATABASE MIGRATOR (GORM) ")
	log.Println("==================================================")

	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("❌ Gagal inisialisasi database: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("❌ Gagal migrasi: %v", err)
	}

	if *seedFlag {
		if err := database.SeedInitialData(db); err != nil {
			log.Fatalf("❌ Gagal seed data: %v", err)
		}
	}

	log.Println("🚀 Operasi database selesai dengan sukses!")
}
