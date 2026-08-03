package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Flight struct {
	ID             string    `gorm:"type:uuid;primaryKey" json:"id"`
	FlightNumber   string    `gorm:"uniqueIndex;not null" json:"flightNumber"`
	Airline        string    `gorm:"not null" json:"airline"`
	Origin         string    `gorm:"not null;index" json:"origin"`
	Destination    string    `gorm:"not null;index" json:"destination"`
	DepartureTime  time.Time `gorm:"not null" json:"departureTime"`
	ArrivalTime    time.Time `gorm:"not null" json:"arrivalTime"`
	Duration       string    `json:"duration"`
	Price          float64   `gorm:"type:decimal(10,2);not null" json:"price"`
	AvailableSeats int       `gorm:"not null" json:"availableSeats"`
	Class          string    `gorm:"type:varchar(20);default:'economy'" json:"class"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

func (f *Flight) BeforeCreate(tx *gorm.DB) error {
	if f.ID == "" {
		f.ID = uuid.New().String()
	}
	return nil
}
