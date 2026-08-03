package handlers

import (
	"net/http"
	"time"
	"booking-service/internal/config"
	"booking-service/internal/database"
	"booking-service/internal/models"
	"booking-service/internal/services"
	"booking-service/internal/utils"
	"github.com/gin-gonic/gin"
)

type CreateBookingRequest struct {
	UserID           string                  `json:"userId" binding:"required"`
	ReferenceID      string                  `json:"referenceId" binding:"required"`
	TotalAmount      float64                 `json:"totalAmount" binding:"required,gt=0"`
	PassengerDetails models.PassengerDetails `json:"passengerDetails" binding:"required"`
	TravelDate       string                  `json:"travelDate" binding:"required"`
}

func createBooking(bookingType models.BookingType, cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req CreateBookingRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		travelDate, err := time.Parse("2006-01-02", req.TravelDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid travelDate format, use YYYY-MM-DD"})
			return
		}
		booking := models.Booking{
			UserID:           req.UserID,
			Type:             bookingType,
			ReferenceID:      req.ReferenceID,
			Status:           models.StatusConfirmed,
			TotalAmount:      req.TotalAmount,
			PassengerDetails: req.PassengerDetails,
			TravelDate:       travelDate,
		}
		if err := database.DB.Create(&booking).Error; err != nil {
			utils.Logger.Sugar().Errorf("Failed to create booking: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create booking"})
			return
		}
		utils.BookingCounter.WithLabelValues(string(bookingType)).Inc()
		utils.BookingStatusCounter.WithLabelValues("confirmed").Inc()
		services.SendBookingConfirmed(cfg.NotificationServiceURL, req.UserID, booking.ID)
		c.JSON(http.StatusCreated, gin.H{"booking": booking})
	}
}

func CreateFlightBooking(cfg *config.Config) gin.HandlerFunc {
	return createBooking(models.TypeFlight, cfg)
}

func CreateHotelBooking(cfg *config.Config) gin.HandlerFunc {
	return createBooking(models.TypeHotel, cfg)
}

func GetUserBookings() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("userId")
		var bookings []models.Booking
		database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&bookings)
		c.JSON(http.StatusOK, gin.H{"bookings": bookings})
	}
}

func GetBookingByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		var booking models.Booking
		if err := database.DB.First(&booking, "id = ?", c.Param("bookingId")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Booking not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"booking": booking})
	}
}

func CancelBooking(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var booking models.Booking
		if err := database.DB.First(&booking, "id = ?", c.Param("bookingId")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Booking not found"})
			return
		}
		if booking.Status == models.StatusCancelled {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Booking already cancelled"})
			return
		}
		booking.Status = models.StatusCancelled
		database.DB.Save(&booking)
		utils.BookingStatusCounter.WithLabelValues("cancelled").Inc()
		services.SendBookingCancelled(cfg.NotificationServiceURL, booking.UserID, booking.ID)
		c.JSON(http.StatusOK, gin.H{"booking": booking})
	}
}

func UpdateBookingStatus() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Status models.BookingStatus `json:"status" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		var booking models.Booking
		if err := database.DB.First(&booking, "id = ?", c.Param("bookingId")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Booking not found"})
			return
		}
		booking.Status = req.Status
		database.DB.Save(&booking)
		c.JSON(http.StatusOK, gin.H{"booking": booking})
	}
}
