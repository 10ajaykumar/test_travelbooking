package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"search-service/internal/cache"
	"search-service/internal/database"
	"search-service/internal/models"
	"search-service/internal/utils"

	"github.com/gin-gonic/gin"
)

func SearchFlights() gin.HandlerFunc {
	return func(c *gin.Context) {
		from := c.Query("from")
		to := c.Query("to")
		date := c.Query("date")
		passengers := c.Query("passengers")

		cacheKey := fmt.Sprintf("flights:%s:%s:%s:%s", from, to, date, passengers)
		ctx := context.Background()

		// Check Redis cache first
		var flights []models.Flight
		if cache.Client != nil {
			hit, err := cache.Get(ctx, cacheKey, &flights)
			if err == nil && hit {
				utils.CacheHits.WithLabelValues("hit").Inc()
				c.JSON(http.StatusOK, gin.H{"flights": flights, "cached": true})
				return
			}
		}
		utils.CacheHits.WithLabelValues("miss").Inc()

		// Query PostgreSQL
		query := database.DB.Model(&models.Flight{})
		if from != "" {
			query = query.Where("UPPER(origin) = UPPER(?)", from)
		}
		if to != "" {
			query = query.Where("UPPER(destination) = UPPER(?)", to)
		}
		if err := query.Find(&flights).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Search failed"})
			return
		}

		// Store in Redis cache with 10 min TTL
		if cache.Client != nil {
			cache.Set(ctx, cacheKey, flights, 10*time.Minute)
		}

		utils.SearchQueries.WithLabelValues("flight").Inc()
		c.JSON(http.StatusOK, gin.H{"flights": flights, "cached": false})
	}
}

func GetFlightByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		var flight models.Flight
		if err := database.DB.First(&flight, "id = ?", c.Param("id")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Flight not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"flight": flight})
	}
}
