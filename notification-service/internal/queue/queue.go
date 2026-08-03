package queue

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const TaskSendNotification = "notification:send"

type NotificationJob struct {
	UserID    string `json:"userId"`
	Type      string `json:"type"`
	BookingID string `json:"bookingId,omitempty"`
	PaymentID string `json:"paymentId,omitempty"`
	UserEmail string `json:"userEmail,omitempty"`
}

var Client *asynq.Client

func InitClient(redisHost, redisPort string) {
	Client = asynq.NewClient(asynq.RedisClientOpt{
		Addr: fmt.Sprintf("%s:%s", redisHost, redisPort),
	})
}

func Enqueue(job NotificationJob) (string, error) {
	data, err := json.Marshal(job)
	if err != nil {
		return "", err
	}
	task := asynq.NewTask(TaskSendNotification, data)
	info, err := Client.Enqueue(task)
	if err != nil {
		return "", err
	}
	return info.ID, nil
}
