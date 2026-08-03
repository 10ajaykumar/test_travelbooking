package services

import (
	"fmt"
	"notification-service/internal/config"
	"notification-service/internal/utils"
	"strconv"

	gomail "gopkg.in/gomail.v2"
)

func SendEmail(cfg *config.Config, to, subject, htmlBody string) error {
	if cfg.SMTPHost == "" {
		utils.Logger.Sugar().Infof("SMTP not configured — skipping email to %s: %s", to, subject)
		return nil
	}
	port, err := strconv.Atoi(cfg.SMTPPort)
	if err != nil {
		port = 587
	}
	m := gomail.NewMessage()
	m.SetHeader("From", "noreply@travelbook.com")
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", htmlBody)
	d := gomail.NewDialer(cfg.SMTPHost, port, cfg.SMTPUser, cfg.SMTPPass)
	if err := d.DialAndSend(m); err != nil {
		return fmt.Errorf("email send failed: %w", err)
	}
	return nil
}

func GenerateEmailHTML(notifType, bookingID, paymentID string) string {
	switch notifType {
	case "booking_confirmed":
		return fmt.Sprintf(`<div style="font-family:Arial,sans-serif;padding:20px"><h2 style="color:#2563eb">Booking Confirmed!</h2><p>Booking <strong>%s</strong> confirmed. Have a great trip!</p></div>`, bookingID)
	case "booking_cancelled":
		return fmt.Sprintf(`<div style="font-family:Arial,sans-serif;padding:20px"><h2 style="color:#dc2626">Booking Cancelled</h2><p>Booking <strong>%s</strong> has been cancelled.</p></div>`, bookingID)
	case "payment_success":
		return fmt.Sprintf(`<div style="font-family:Arial,sans-serif;padding:20px"><h2 style="color:#16a34a">Payment Successful!</h2><p>Payment <strong>%s</strong> processed successfully.</p></div>`, paymentID)
	default:
		return `<div style="font-family:Arial,sans-serif;padding:20px"><p>You have a new notification from TravelBook.</p></div>`
	}
}
