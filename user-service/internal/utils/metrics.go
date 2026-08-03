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
		Name: "user_http_requests_total",
		Help: "Total HTTP requests",
	}, []string{"method", "route", "status_code"})

	HttpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "user_http_request_duration_seconds",
		Help:    "HTTP request duration",
		Buckets: []float64{0.1, 0.3, 0.5, 1, 2, 5},
	}, []string{"method", "route", "status_code"})

	ActiveConnections = promauto.NewGauge(prometheus.GaugeOpts{
		Name: "user_active_connections",
		Help: "Active connections",
	})
)

func MetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		ActiveConnections.Inc()
		c.Next()
		ActiveConnections.Dec()
		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())
		HttpRequestsTotal.WithLabelValues(c.Request.Method, c.FullPath(), status).Inc()
		HttpRequestDuration.WithLabelValues(c.Request.Method, c.FullPath(), status).Observe(duration)
	}
}
