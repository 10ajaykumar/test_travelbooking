package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"search-service/internal/cache"
	"search-service/internal/config"
	"search-service/internal/database"
	"search-service/internal/models"
	"search-service/internal/routes"
	"search-service/internal/seeds"
	"search-service/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()
	utils.InitLogger(cfg.NodeEnv)
	defer utils.Logger.Sync()

	if cfg.NodeEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	if err := database.Connect(cfg); err != nil {
		utils.Logger.Fatal("Database connection failed", zap.Error(err))
	}
	if err := database.DB.AutoMigrate(&models.Flight{}, &models.Hotel{}); err != nil {
		utils.Logger.Fatal("Migration failed", zap.Error(err))
	}

	// Connect Redis (non-fatal if unavailable)
	if err := cache.Connect(cfg.RedisHost, cfg.RedisPort); err != nil {
		utils.Logger.Warn("Redis unavailable, running without cache", zap.Error(err))
	} else {
		utils.Logger.Info("Redis connected", zap.String("addr", cfg.RedisHost+":"+cfg.RedisPort))
	}

	seeds.SeedAll()
	utils.Logger.Info("Seed data loaded")

	r := gin.New()
	r.Use(gin.Recovery())
	routes.Setup(r)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: r}
	go func() {
		utils.Logger.Info("Search Service started", zap.String("port", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.Logger.Fatal("Server failed", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
	utils.Logger.Info("Search Service stopped")
}
