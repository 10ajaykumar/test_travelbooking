package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentStatus string

const (
	StatusPending  PaymentStatus = "pending"
	StatusSuccess  PaymentStatus = "success"
	StatusFailed   PaymentStatus = "failed"
	StatusRefunded PaymentStatus = "refunded"
)

type PaymentMethod struct {
	Last4       string `json:"last4"`
	Brand       string `json:"brand"`
	ExpiryMonth string `json:"expiryMonth"`
	ExpiryYear  string `json:"expiryYear"`
}

func (pm PaymentMethod) Value() (driver.Value, error) {
	return json.Marshal(pm)
}

func (pm *PaymentMethod) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, pm)
}

type Payment struct {
	ID            string        `gorm:"type:uuid;primaryKey" json:"id"`
	BookingID     string        `gorm:"type:uuid;not null;index" json:"bookingId"`
	UserID        string        `gorm:"type:uuid;not null;index" json:"userId"`
	Amount        float64       `gorm:"type:decimal(10,2);not null" json:"amount"`
	Currency      string        `gorm:"type:varchar(3);default:'USD'" json:"currency"`
	Status        PaymentStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	PaymentMethod PaymentMethod `gorm:"serializer:json" json:"paymentMethod"`
	TransactionID string        `json:"transactionId,omitempty"`
	FailureReason string        `json:"failureReason,omitempty"`
	CreatedAt     time.Time     `json:"createdAt"`
	UpdatedAt     time.Time     `json:"updatedAt"`
}

func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}
