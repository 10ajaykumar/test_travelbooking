package handlers

import (
	"net/http"
	"time"
	"user-service/internal/config"
	"user-service/internal/database"
	"user-service/internal/middleware"
	"user-service/internal/models"
	"user-service/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type RegisterRequest struct {
	Name     string `json:"name" binding:"required,min=2"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func generateToken(user *models.User, secret string) (string, error) {
	claims := middleware.Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   string(user.Role),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func Register(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		var existing models.User
		if err := database.DB.Where("email = ?", req.Email).First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"message": "Email already registered"})
			return
		}
		user := models.User{Name: req.Name, Email: req.Email, Password: req.Password}
		if err := database.DB.Create(&user).Error; err != nil {
			utils.Logger.Error("Failed to create user: " + err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create user"})
			return
		}
		token, err := generateToken(&user, cfg.JWTSecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to generate token"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"token": token, "user": user})
	}
}

func Login(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		var user models.User
		if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid credentials"})
			return
		}
		if !user.ComparePassword(req.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid credentials"})
			return
		}
		token, err := generateToken(&user, cfg.JWTSecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to generate token"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"token": token, "user": user})
	}
}
