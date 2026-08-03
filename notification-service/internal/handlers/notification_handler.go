package handlers

import (
	"net/http"

	"notification-service/internal/database"
	"notification-service/internal/models"
	"notification-service/internal/queue"
	"notification-service/internal/utils"

	"github.com/gin-gonic/gin"
)

type SendRequest struct {
	UserID    string `json:"userId" binding:"required"`
	Type      string `json:"type" binding:"required"`
	BookingID string `json:"bookingId"`
	PaymentID string `json:"paymentId"`
	UserEmail string `json:"userEmail"`
}

func SendNotification() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req SendRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		valid := map[string]bool{
			"booking_confirmed": true,
			"booking_cancelled": true,
			"payment_success":   true,
			"payment_failed":    true,
		}
		if !valid[req.Type] {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid notification type"})
			return
		}

		jobID, err := queue.Enqueue(queue.NotificationJob{
			UserID:    req.UserID,
			Type:      req.Type,
			BookingID: req.BookingID,
			PaymentID: req.PaymentID,
			UserEmail: req.UserEmail,
		})
		if err != nil {
			utils.Logger.Sugar().Errorf("Failed to enqueue notification: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to queue notification"})
			return
		}

		utils.Logger.Sugar().Infof("Notification enqueued jobId=%s type=%s userId=%s", jobID, req.Type, req.UserID)
		c.JSON(http.StatusAccepted, gin.H{"message": "Notification queued", "jobId": jobID})
	}
}

func GetUserNotifications() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.Param("userId")
		var notifications []models.Notification
		database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&notifications)

		unreadCount := 0
		for _, n := range notifications {
			if !n.IsRead {
				unreadCount++
			}
		}
		c.JSON(http.StatusOK, gin.H{"notifications": notifications, "unreadCount": unreadCount})
	}
}

func MarkAsRead() gin.HandlerFunc {
	return func(c *gin.Context) {
		var notification models.Notification
		if err := database.DB.First(&notification, "id = ?", c.Param("id")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Notification not found"})
			return
		}
		database.DB.Model(&notification).Update("is_read", true)
		c.JSON(http.StatusOK, gin.H{"notification": notification})
	}
}
