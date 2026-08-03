package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationType string

const (
	TypeBookingConfirmed NotificationType = "booking_confirmed"
	TypeBookingCancelled NotificationType = "booking_cancelled"
	TypePaymentSuccess   NotificationType = "payment_success"
	TypePaymentFailed    NotificationType = "payment_failed"
)

type Notification struct {
	ID        string           `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    string           `gorm:"not null;index" json:"userId"`
	Type      NotificationType `gorm:"type:varchar(50);not null" json:"type"`
	Title     string           `gorm:"not null" json:"title"`
	Message   string           `gorm:"type:text;not null" json:"message"`
	IsRead    bool             `gorm:"default:false" json:"isRead"`
	BookingID string           `gorm:"index" json:"bookingId,omitempty"`
	PaymentID string           `json:"paymentId,omitempty"`
	EmailSent bool             `gorm:"default:false" json:"emailSent"`
	CreatedAt time.Time        `json:"createdAt"`
	UpdatedAt time.Time        `json:"updatedAt"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	return nil
}

func BuildContent(notifType NotificationType, bookingID, paymentID string) (title, message string) {
	switch notifType {
	case TypeBookingConfirmed:
		return "Booking Confirmed", "Your booking " + bookingID + " has been confirmed! Have a great trip."
	case TypeBookingCancelled:
		return "Booking Cancelled", "Your booking " + bookingID + " has been cancelled."
	case TypePaymentSuccess:
		return "Payment Successful", "Payment successful! Your booking is confirmed."
	case TypePaymentFailed:
		return "Payment Failed", "Your payment failed. Please try again."
	default:
		return "Notification", "You have a new notification."
	}
}
