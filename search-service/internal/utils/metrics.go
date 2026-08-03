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
		Name: "search_http_requests_total",
		Help: "Total HTTP requests",
	}, []string{"method", "route", "status_code"})

	HttpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "search_http_request_duration_seconds",
		Help:    "HTTP request duration",
		Buckets: []float64{0.1, 0.3, 0.5, 1, 2, 5},
	}, []string{"method", "route", "status_code"})

	SearchQueries = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "search_queries_total",
		Help: "Search queries by type",
	}, []string{"type"})

	CacheHits = promauto.NewCounterVec(prometheus.CounterOpts{
		Name: "search_cache_hits_total",
		Help: "Cache hit/miss counter",
	}, []string{"result"}) // "hit" or "miss"
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
