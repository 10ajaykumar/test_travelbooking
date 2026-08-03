package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"payment-service/internal/utils"
)

type NotificationPayload struct {
	UserID    string `json:"userId"`
	Type      string `json:"type"`
	PaymentID string `json:"paymentId"`
	BookingID string `json:"bookingId,omitempty"`
}

func SendPaymentSuccess(notificationURL, userID, paymentID, bookingID string) {
	go func() {
		payload := NotificationPayload{UserID: userID, Type: "payment_success", PaymentID: paymentID, BookingID: bookingID}
		data, _ := json.Marshal(payload)
		resp, err := http.Post(fmt.Sprintf("%s/api/notifications/send", notificationURL), "application/json", bytes.NewBuffer(data))
		if err != nil {
			utils.Logger.Sugar().Warnf("notification send failed: %v", err)
			return
		}
		defer resp.Body.Close()
	}()
}

func SendPaymentFailed(notificationURL, userID, paymentID string) {
	go func() {
		payload := NotificationPayload{UserID: userID, Type: "payment_failed", PaymentID: paymentID}
		data, _ := json.Marshal(payload)
		resp, err := http.Post(fmt.Sprintf("%s/api/notifications/send", notificationURL), "application/json", bytes.NewBuffer(data))
		if err != nil {
			utils.Logger.Sugar().Warnf("notification send failed: %v", err)
			return
		}
		defer resp.Body.Close()
	}()
}
