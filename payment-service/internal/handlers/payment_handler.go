package handlers

import (
	"net/http"

	"payment-service/internal/config"
	"payment-service/internal/database"
	"payment-service/internal/models"
	"payment-service/internal/services"
	"payment-service/internal/utils"

	"github.com/gin-gonic/gin"
)

type ProcessPaymentRequest struct {
	BookingID   string  `json:"bookingId" binding:"required"`
	UserID      string  `json:"userId" binding:"required"`
	Amount      float64 `json:"amount" binding:"required,gt=0"`
	Currency    string  `json:"currency"`
	CardNumber  string  `json:"cardNumber" binding:"required"`
	ExpiryMonth string  `json:"expiryMonth" binding:"required"`
	ExpiryYear  string  `json:"expiryYear" binding:"required"`
	CVV         string  `json:"cvv" binding:"required"`
}

func ProcessPayment(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req ProcessPaymentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		currency := req.Currency
		if currency == "" {
			currency = "USD"
		}

		payment := models.Payment{
			BookingID: req.BookingID,
			UserID:    req.UserID,
			Amount:    req.Amount,
			Currency:  currency,
			Status:    models.StatusPending,
		}
		if err := database.DB.Create(&payment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create payment record"})
			return
		}

		result, err := services.ProcessPayment(services.PaymentRequest{
			Amount:      req.Amount,
			Currency:    currency,
			CardNumber:  req.CardNumber,
			ExpiryMonth: req.ExpiryMonth,
			ExpiryYear:  req.ExpiryYear,
			CVV:         req.CVV,
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Payment processing error"})
			return
		}

		if result.Success {
			payment.Status = models.StatusSuccess
			payment.TransactionID = result.TransactionID
			payment.PaymentMethod = models.PaymentMethod{
				Last4:       result.Last4,
				Brand:       result.Brand,
				ExpiryMonth: req.ExpiryMonth,
				ExpiryYear:  req.ExpiryYear,
			}
			database.DB.Save(&payment)
			utils.PaymentSuccessCounter.Inc()
			utils.TotalAmountGauge.Add(req.Amount)
			services.UpdateBookingStatus(cfg.BookingServiceURL, req.BookingID, "confirmed")
			services.SendPaymentSuccess(cfg.NotificationServiceURL, req.UserID, payment.ID, req.BookingID)
		} else {
			payment.Status = models.StatusFailed
			payment.FailureReason = result.Error
			database.DB.Save(&payment)
			utils.PaymentFailureCounter.Inc()
			services.SendPaymentFailed(cfg.NotificationServiceURL, req.UserID, payment.ID)
		}

		c.JSON(http.StatusOK, gin.H{"payment": payment})
	}
}

func GetPaymentByID() gin.HandlerFunc {
	return func(c *gin.Context) {
		var payment models.Payment
		if err := database.DB.First(&payment, "id = ?", c.Param("paymentId")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Payment not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"payment": payment})
	}
}

func GetPaymentByBookingID() gin.HandlerFunc {
	return func(c *gin.Context) {
		var payment models.Payment
		if err := database.DB.First(&payment, "booking_id = ?", c.Param("bookingId")).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Payment not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"payment": payment})
	}
}

func RefundPayment() gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			PaymentID string `json:"paymentId" binding:"required"`
			Reason    string `json:"reason"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		var payment models.Payment
		if err := database.DB.First(&payment, "id = ?", req.PaymentID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "Payment not found"})
			return
		}
		if payment.Status != models.StatusSuccess {
			c.JSON(http.StatusBadRequest, gin.H{"message": "Only successful payments can be refunded"})
			return
		}
		result, err := services.RefundPayment(payment.TransactionID, payment.Amount)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		payment.Status = models.StatusRefunded
		database.DB.Save(&payment)
		utils.RefundCounter.Inc()
		c.JSON(http.StatusOK, gin.H{"payment": payment, "refundId": result.RefundID})
	}
}
