package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BookingType   string
type BookingStatus string

const (
	TypeFlight BookingType = "flight"
	TypeHotel  BookingType = "hotel"

	StatusPending   BookingStatus = "pending"
	StatusConfirmed BookingStatus = "confirmed"
	StatusCancelled BookingStatus = "cancelled"
)

type PassengerDetails struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Passengers int    `json:"passengers"`
}

type Booking struct {
	ID               string           `gorm:"type:uuid;primaryKey" json:"id"`
	UserID           string           `gorm:"type:uuid;not null;index" json:"userId"`
	Type             BookingType      `gorm:"type:varchar(20);not null" json:"type"`
	ReferenceID      string           `gorm:"not null" json:"referenceId"`
	Status           BookingStatus    `gorm:"type:varchar(20);default:'pending'" json:"status"`
	TotalAmount      float64          `gorm:"type:decimal(10,2);not null" json:"totalAmount"`
	PassengerDetails PassengerDetails `gorm:"serializer:json" json:"passengerDetails"`
	BookingDate      time.Time        `gorm:"not null" json:"bookingDate"`
	TravelDate       time.Time        `gorm:"not null" json:"travelDate"`
	CreatedAt        time.Time        `json:"createdAt"`
	UpdatedAt        time.Time        `json:"updatedAt"`
}

func (b *Booking) BeforeCreate(tx *gorm.DB) error {
	if b.ID == "" {
		b.ID = uuid.New().String()
	}
	if b.BookingDate.IsZero() {
		b.BookingDate = time.Now()
	}
	return nil
}
