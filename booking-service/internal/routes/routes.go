package routes

import (
	"booking-service/internal/config"
	"booking-service/internal/handlers"
	"booking-service/internal/middleware"
	"booking-service/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Setup(r *gin.Engine, cfg *config.Config) {
	r.Use(utils.MetricsMiddleware())

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "booking-service"})
	})
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	api := r.Group("/api/bookings")
	api.Use(middleware.AuthMiddleware(cfg))
	{
		api.POST("/flight", handlers.CreateFlightBooking(cfg))
		api.POST("/hotel", handlers.CreateHotelBooking(cfg))
		api.GET("/user/:userId", handlers.GetUserBookings())
		api.GET("/:bookingId", handlers.GetBookingByID())
		api.PUT("/:bookingId/cancel", handlers.CancelBooking(cfg))
	}
	// Internal endpoint — no auth
	r.PUT("/api/bookings/:bookingId/status", handlers.UpdateBookingStatus())
}
