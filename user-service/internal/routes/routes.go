package routes

import (
	"user-service/internal/config"
	"user-service/internal/handlers"
	"user-service/internal/middleware"
	"user-service/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Setup(r *gin.Engine, cfg *config.Config) {
	r.Use(utils.MetricsMiddleware())

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "user-service"})
	})
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	api := r.Group("/api/users")
	{
		api.POST("/register", handlers.Register(cfg))
		api.POST("/login", handlers.Login(cfg))

		auth := api.Group("")
		auth.Use(middleware.AuthMiddleware(cfg))
		{
			auth.GET("/profile", handlers.GetProfile())
			auth.PUT("/profile", handlers.UpdateProfile())
		}
	}
}
