package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"notification-service/internal/config"
	"notification-service/internal/database"
	"notification-service/internal/models"
	"notification-service/internal/queue"
	"notification-service/internal/routes"
	"notification-service/internal/utils"
	"notification-service/internal/worker"

	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
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
	if err := database.DB.AutoMigrate(&models.Notification{}); err != nil {
		utils.Logger.Fatal("Migration failed", zap.Error(err))
	}

	// Init Asynq Redis client
	queue.InitClient(cfg.RedisHost, cfg.RedisPort)
	utils.Logger.Info("Redis queue connected", zap.String("addr", cfg.RedisHost+":"+cfg.RedisPort))

	// Start Asynq worker server
	asynqSrv := worker.NewServer(cfg)
	mux := asynq.NewServeMux()
	mux.HandleFunc(queue.TaskSendNotification, worker.HandleNotificationTask(cfg))
	go func() {
		if err := asynqSrv.Run(mux); err != nil {
			utils.Logger.Error("Asynq worker error", zap.Error(err))
		}
	}()

	r := gin.New()
	r.Use(gin.Recovery())
	routes.Setup(r)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: r}
	go func() {
		utils.Logger.Info("Notification Service started", zap.String("port", cfg.Port))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.Logger.Fatal("Server failed", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	asynqSrv.Shutdown()
	queue.Client.Close()

	shutCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(shutCtx)
	utils.Logger.Info("Notification Service stopped")
}
