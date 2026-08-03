package config

import "os"

type Config struct {
	Port                   string
	DBHost                 string
	DBPort                 string
	DBName                 string
	DBUser                 string
	DBPassword             string
	JWTSecret              string
	BookingServiceURL      string
	NotificationServiceURL string
	NodeEnv                string
}

func Load() *Config {
	return &Config{
		Port:                   getEnv("PORT", "3004"),
		DBHost:                 getEnv("DB_HOST", "localhost"),
		DBPort:                 getEnv("DB_PORT", "5432"),
		DBName:                 getEnv("DB_NAME", "paymentdb"),
		DBUser:                 getEnv("DB_USER", "postgres"),
		DBPassword:             getEnv("DB_PASSWORD", "postgres"),
		JWTSecret:              getEnv("JWT_SECRET", "supersecret"),
		BookingServiceURL:      getEnv("BOOKING_SERVICE_URL", "http://booking-service:3003"),
		NotificationServiceURL: getEnv("NOTIFICATION_SERVICE_URL", "http://notification-service:3005"),
		NodeEnv:                getEnv("NODE_ENV", "development"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
