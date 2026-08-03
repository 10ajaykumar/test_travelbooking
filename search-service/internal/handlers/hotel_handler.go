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

func SearchHotels() gin.HandlerFunc {
	return func(c *gin.Context) {
		city := c.Query("city")
		checkin := c.Query("checkin")
		checkout := c.Query("checkout")
		guests := c.Query("guests")

		cacheKey := fmt.Sprintf("hotels:%s:%s:%s:%s", city, checkin, checkout, guests)
		ctx := context.Background()

		// Check Redis cache first
		var hotels []models.Hotel
		if cache.Client != nil {
			hit, err := cache.Get(ctx, cacheKey, &hotels)
			if err == nil && hit {
				utils.CacheHits.WithLabelValues("hit").Inc()
				c.JSON(http.StatusOK, gin.H{"hotels": hotels, "cached": true})
				return
			}
		}
		utils.CacheHits.WithLabelValues("miss").Inc()

		// Query PostgreSQL
		query := database.DB.Model(&models.Hotel{})
		if city != "" {
			query = query.Where("UPPER(city) = UPPER(?)", city)
		}
		if err := query.Find(&hotels).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Search failed"})
			return
		}

		// Store in Redis cache with 10 min TTL
		if cache.Client != nil {
			cache.Set(ctx, cacheKey, hotels, 10*time.Minute)
		}

		utils.SearchQueries.WithLabelValues("hotel").Inc()
		c.JSON(http.StatusOK, gin.H{"hotels": hotels, "cached": false})
	}
}

func GetHotelByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		var hotel models.Hotel
		if err := database.DB.First(&hotel, "id = ?", c.Param("id")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Hotel not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"hotel": hotel})
	}
}
