package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// StringSlice is a custom type for storing string arrays in PostgreSQL as JSONB
type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	return json.Marshal(s)
}
func (s *StringSlice) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, s)
}

type Hotel struct {
	ID             string      `gorm:"type:uuid;primaryKey" json:"id"`
	Name           string      `gorm:"not null" json:"name"`
	City           string      `gorm:"not null;index" json:"city"`
	Address        string      `json:"address"`
	Rating         float64     `gorm:"type:decimal(3,1)" json:"rating"`
	PricePerNight  float64     `gorm:"type:decimal(10,2);not null" json:"pricePerNight"`
	AvailableRooms int         `gorm:"not null" json:"availableRooms"`
	Amenities      StringSlice `gorm:"type:jsonb" json:"amenities"`
	Images         StringSlice `gorm:"type:jsonb" json:"images"`
	Description    string      `gorm:"type:text" json:"description"`
	CreatedAt      time.Time   `json:"createdAt"`
	UpdatedAt      time.Time   `json:"updatedAt"`
}

func (h *Hotel) BeforeCreate(tx *gorm.DB) error {
	if h.ID == "" {
		h.ID = uuid.New().String()
	}
	return nil
}
