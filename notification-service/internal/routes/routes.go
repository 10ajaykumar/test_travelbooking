package routes

import (
	"notification-service/internal/handlers"
	"notification-service/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Setup(r *gin.Engine) {
	r.Use(utils.MetricsMiddleware())

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "notification-service"})
	})
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	api := r.Group("/api/notifications")
	{
		api.POST("/send", handlers.SendNotification())
		api.GET("/user/:userId", handlers.GetUserNotifications())
		api.PUT("/:id/read", handlers.MarkAsRead())
	}
}
