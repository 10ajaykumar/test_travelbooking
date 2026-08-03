package routes

import (
	"payment-service/internal/config"
	"payment-service/internal/handlers"
	"payment-service/internal/middleware"
	"payment-service/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Setup(r *gin.Engine, cfg *config.Config) {
	r.Use(utils.MetricsMiddleware())

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "payment-service"})
	})
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	api := r.Group("/api/payments")
	api.Use(middleware.AuthMiddleware(cfg))
	{
		api.POST("/process", handlers.ProcessPayment(cfg))
		api.POST("/refund", handlers.RefundPayment())
		api.GET("/booking/:bookingId", handlers.GetPaymentByBookingID())
		api.GET("/:paymentId", handlers.GetPaymentByID())
	}
}
