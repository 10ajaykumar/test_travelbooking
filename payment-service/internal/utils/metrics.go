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
		Name: "payment_http_requests_total",
		Help: "Total HTTP requests",
	}, []string{"method", "route", "status_code"})

	HttpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "payment_http_request_duration_seconds",
		Help:    "HTTP request duration",
		Buckets: []float64{0.1, 0.3, 0.5, 1, 2, 5},
	}, []string{"method", "route", "status_code"})

	PaymentSuccessCounter = promauto.NewCounter(prometheus.CounterOpts{
		Name: "payment_success_total",
		Help: "Total successful payments",
	})

	PaymentFailureCounter = promauto.NewCounter(prometheus.CounterOpts{
		Name: "payment_failure_total",
		Help: "Total failed payments",
	})

	TotalAmountGauge = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "payment_total_amount_processed",
		Help: "Total payment amount processed",
	})

	RefundCounter = promauto.NewCounter(prometheus.CounterOpts{
		Name: "payment_refund_total",
		Help: "Total refunds",
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
