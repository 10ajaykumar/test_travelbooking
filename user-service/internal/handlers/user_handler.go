package handlers

import (
	"net/http"
	"user-service/internal/database"
	"user-service/internal/models"
	"user-service/internal/utils"

	"github.com/gin-gonic/gin"
)

func GetProfile() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var user models.User
		if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"user": user})
	}
}

type UpdateProfileRequest struct {
	Name  string `json:"name"`
	Email string `json:"email" binding:"omitempty,email"`
}

func UpdateProfile() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, _ := c.Get("userID")
		var req UpdateProfileRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		var user models.User
		if err := database.DB.First(&user, "id = ?", userID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
			return
		}
		if req.Name != "" {
			user.Name = req.Name
		}
		if req.Email != "" && req.Email != user.Email {
			var existing models.User
			if err := database.DB.Where("email = ? AND id != ?", req.Email, userID).First(&existing).Error; err == nil {
				c.JSON(http.StatusConflict, gin.H{"message": "Email already in use"})
				return
			}
			user.Email = req.Email
		}
		if err := database.DB.Save(&user).Error; err != nil {
			utils.Logger.Error("Failed to update user: " + err.Error())
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to update profile"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"user": user})
	}
}
