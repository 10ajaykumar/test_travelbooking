package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	"user-service/internal/config"
	"user-service/internal/database"
	"user-service/internal/models"
	"user-service/internal/routes"
	"user-service/internal/utils"

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

	if err := database.DB.AutoMigrate(&models.User{}); err != nil {
		utils.Logger.Fatal("Migration failed", zap.Error(err))
	}

	r := gin.New()
	r.Use(gin.Recovery())
	routes.Setup(r, cfg)

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		utils.Logger.Info("User Service started", zap.String("port", cfg.Port))
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
	utils.Logger.Info("User Service stopped")
}
