package worker

import (
	"context"
	"encoding/json"
	"fmt"

	"notification-service/internal/config"
	"notification-service/internal/database"
	"notification-service/internal/models"
	"notification-service/internal/queue"
	"notification-service/internal/services"
	"notification-service/internal/utils"

	"github.com/hibiken/asynq"
)

func NewServer(cfg *config.Config) *asynq.Server {
	return asynq.NewServer(
		asynq.RedisClientOpt{
			Addr: fmt.Sprintf("%s:%s", cfg.RedisHost, cfg.RedisPort),
		},
		asynq.Config{
			Concurrency: 5,
			Queues:      map[string]int{"default": 1},
		},
	)
}

func HandleNotificationTask(cfg *config.Config) asynq.HandlerFunc {
	return func(ctx context.Context, t *asynq.Task) error {
		var job queue.NotificationJob
		if err := json.Unmarshal(t.Payload(), &job); err != nil {
			return fmt.Errorf("unmarshal payload: %w", err)
		}

		title, message := models.BuildContent(
			models.NotificationType(job.Type),
			job.BookingID,
			job.PaymentID,
		)

		notification := models.Notification{
			UserID:    job.UserID,
			Type:      models.NotificationType(job.Type),
			Title:     title,
			Message:   message,
			BookingID: job.BookingID,
			PaymentID: job.PaymentID,
			IsRead:    false,
			EmailSent: false,
		}

		if err := database.DB.Create(&notification).Error; err != nil {
			return fmt.Errorf("save notification: %w", err)
		}

		emailTo := job.UserEmail
		if emailTo == "" {
			emailTo = "user@example.com"
		}
		htmlBody := services.GenerateEmailHTML(job.Type, job.BookingID, job.PaymentID)
		if err := services.SendEmail(cfg, emailTo, title, htmlBody); err != nil {
			utils.Logger.Sugar().Warnf("Email failed for %s: %v", notification.ID, err)
		} else {
			database.DB.Model(&notification).Update("email_sent", true)
			utils.EmailSentCounter.Inc()
		}

		utils.NotificationCounter.WithLabelValues(job.Type).Inc()
		utils.Logger.Sugar().Infof("Notification processed id=%s type=%s userId=%s",
			notification.ID, job.Type, job.UserID)
		return nil
	}
}
