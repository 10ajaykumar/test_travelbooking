package config

import (
	"os"
)

type Config struct {
	Port        string
	DBHost      string
	DBPort      string
	DBName      string
	DBUser      string
	DBPassword  string
	JWTSecret   string
	NodeEnv     string
}

func Load() *Config {
	return &Config{
		Port:       getEnv("PORT", "3001"),
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBName:     getEnv("DB_NAME", "userdb"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		JWTSecret:  getEnv("JWT_SECRET", "supersecret"),
		NodeEnv:    getEnv("NODE_ENV", "development"),
	}
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
