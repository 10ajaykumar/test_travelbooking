package services

import (
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"
)

type PaymentRequest struct {
	Amount      float64
	Currency    string
	CardNumber  string
	ExpiryMonth string
	ExpiryYear  string
	CVV         string
}

type PaymentResult struct {
	Success       bool
	TransactionID string
	Last4         string
	Brand         string
	Error         string
}

type RefundResult struct {
	Success  bool
	RefundID string
	Error    string
}

func detectBrand(cardNumber string) string {
	num := strings.ReplaceAll(cardNumber, " ", "")
	switch {
	case strings.HasPrefix(num, "4"):
		return "Visa"
	case strings.HasPrefix(num, "5"):
		return "Mastercard"
	case strings.HasPrefix(num, "3"):
		return "Amex"
	case strings.HasPrefix(num, "6"):
		return "Discover"
	default:
		return "Unknown"
	}
}

func ProcessPayment(req PaymentRequest) (*PaymentResult, error) {
	// Simulate 1-2 second processing delay
	delay := time.Duration(1000+rand.Intn(1000)) * time.Millisecond
	time.Sleep(delay)

	clean := strings.ReplaceAll(req.CardNumber, " ", "")
	if len(clean) < 13 || len(clean) > 19 {
		return &PaymentResult{Success: false, Error: "Invalid card number"}, nil
	}

	// 90% success rate
	if rand.Float64() < 0.9 {
		txID := fmt.Sprintf("TXN_%s", strings.ToUpper(uuid.New().String()[:16]))
		return &PaymentResult{
			Success:       true,
			TransactionID: txID,
			Last4:         clean[len(clean)-4:],
			Brand:         detectBrand(clean),
		}, nil
	}

	failures := []string{
		"Payment declined by issuer",
		"Insufficient funds",
		"Card restricted",
		"Transaction limit exceeded",
	}
	return &PaymentResult{
		Success: false,
		Error:   failures[rand.Intn(len(failures))],
	}, nil
}

func RefundPayment(transactionID string, amount float64) (*RefundResult, error) {
	time.Sleep(1 * time.Second)
	if rand.Float64() < 0.95 {
		refundID := fmt.Sprintf("REF_%s", strings.ToUpper(uuid.New().String()[:16]))
		return &RefundResult{Success: true, RefundID: refundID}, nil
	}
	return nil, errors.New("refund failed, please try again")
}
