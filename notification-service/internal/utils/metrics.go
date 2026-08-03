package utils

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

var (
	HttpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "notification_http_requests_total",
		Help: "Total HTTP requests",
	}, []string{"method", "route", "status_code"})

	HttpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "notification_http_request_duration_seconds",
		Help:    "HTTP request duration",
		Buckets: []float64{0.1, 0.3, 0.5, 1, 2, 5},
	}, []string{"method", "route", "status_code"})

	NotificationCounter = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "notification_sent_total",
		Help: "Notifications sent by type",
	}, []string{"type"})

	QueueSizeGauge = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "notification_queue_size",
		Help: "Notification queue size",
	})

	EmailSentCounter = promauto.NewCounter(prometheus.CounterOpts{
		Name: "notification_emails_sent_total",
		Help: "Total emails sent",
	})
)

func MetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())
		HttpRequestsTotal.WithLabelValues(c.Request.Method, c.FullPath(), status).Inc()
		HttpRequestDuration.WithLabelValues(c.Request.Method, c.FullPath(), status).Observe(duration)
	}
}
