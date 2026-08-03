package routes

import (
	"search-service/internal/handlers"
	"search-service/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

func Setup(r *gin.Engine) {
	r.Use(utils.MetricsMiddleware())

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "search-service"})
	})
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	api := r.Group("/api/search")
	{
		api.GET("/flights", handlers.SearchFlights())
		api.GET("/flights/:id", handlers.GetFlightByID())
		api.GET("/hotels", handlers.SearchHotels())
		api.GET("/hotels/:id", handlers.GetHotelByID())
	}
}
