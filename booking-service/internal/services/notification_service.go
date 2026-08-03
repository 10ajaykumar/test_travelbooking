package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"booking-service/internal/utils"
)

type NotificationPayload struct {
	UserID    string `json:"userId"`
	Type      string `json:"type"`
	BookingID string `json:"bookingId"`
}

func SendBookingConfirmed(notificationURL, userID, bookingID string) {
	go func() {
		payload := NotificationPayload{UserID: userID, Type: "booking_confirmed", BookingID: bookingID}
		data, _ := json.Marshal(payload)
		resp, err := http.Post(fmt.Sprintf("%s/api/notifications/send", notificationURL), "application/json", bytes.NewBuffer(data))
		if err != nil {
			utils.Logger.Sugar().Warnf("Failed to send booking_confirmed notification: %v", err)
			return
		}
		defer resp.Body.Close()
	}()
}

func SendBookingCancelled(notificationURL, userID, bookingID string) {
	go func() {
		payload := NotificationPayload{UserID: userID, Type: "booking_cancelled", BookingID: bookingID}
		data, _ := json.Marshal(payload)
		resp, err := http.Post(fmt.Sprintf("%s/api/notifications/send", notificationURL), "application/json", bytes.NewBuffer(data))
		if err != nil {
			utils.Logger.Sugar().Warnf("Failed to send booking_cancelled notification: %v", err)
			return
		}
		defer resp.Body.Close()
	}()
}
