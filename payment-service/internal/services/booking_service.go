package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"payment-service/internal/utils"
)

func UpdateBookingStatus(bookingServiceURL, bookingID, status string) {
	go func() {
		payload := map[string]string{"status": status}
		data, _ := json.Marshal(payload)
		client := &http.Client{Timeout: 5 * time.Second}
		url := fmt.Sprintf("%s/api/bookings/%s/status", bookingServiceURL, bookingID)
		req, err := http.NewRequest(http.MethodPut, url, bytes.NewBuffer(data))
		if err != nil {
			return
		}
		req.Header.Set("Content-Type", "application/json")
		resp, err := client.Do(req)
		if err != nil {
			utils.Logger.Sugar().Warnf("Failed to update booking status: %v", err)
			return
		}
		defer resp.Body.Close()
	}()
}
