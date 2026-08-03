package seeds

import (
	"fmt"
	"math"
	"math/rand"
	"time"

	"search-service/internal/database"
	"search-service/internal/models"
)

var airlines = []string{"Emirates", "Delta", "United", "British Airways", "Lufthansa", "Air France", "Singapore Airlines", "Qatar Airways"}

var flightRoutes = [][2]string{
	{"NYC", "LAX"}, {"LAX", "NYC"}, {"NYC", "LHR"}, {"LHR", "NYC"},
	{"LAX", "SFO"}, {"SFO", "LAX"}, {"NYC", "ORD"}, {"ORD", "NYC"},
	{"LAX", "DFW"}, {"DFW", "LAX"}, {"LHR", "CDG"}, {"CDG", "LHR"},
	{"NYC", "MIA"}, {"MIA", "NYC"}, {"LAX", "SEA"}, {"SEA", "LAX"},
	{"NYC", "BOS"}, {"BOS", "NYC"}, {"DFW", "ORD"}, {"ORD", "DFW"},
}

type hotelData struct {
	Name, City, Address, Description string
	Rating, Price                     float64
	Rooms                             int
	Amenities                         []string
}

var hotels = []hotelData{
	{"Grand Hyatt New York", "New York", "109 E 42nd St", "Luxury hotel in midtown Manhattan.", 4.5, 350, 10, []string{"WiFi", "Spa", "Pool", "Restaurant", "Gym"}},
	{"Marriott Downtown LA", "Los Angeles", "333 S Figueroa St", "Modern hotel in downtown LA.", 4.2, 220, 12, []string{"WiFi", "Pool", "Restaurant", "Parking"}},
	{"The Savoy London", "London", "Strand, WC2R 0EU", "Iconic luxury hotel on the Thames.", 4.8, 480, 6, []string{"WiFi", "Spa", "Restaurant", "Bar"}},
	{"Hotel Le Meurice Paris", "Paris", "228 Rue de Rivoli", "Palace hotel near Tuileries Garden.", 4.9, 550, 5, []string{"WiFi", "Spa", "Pool", "Fine Dining"}},
	{"Burj Al Arab Dubai", "Dubai", "Jumeirah Beach Rd", "World-famous 7-star hotel.", 5.0, 800, 4, []string{"WiFi", "Private Beach", "Spa", "Butler Service"}},
	{"Marina Bay Sands Singapore", "Singapore", "10 Bayfront Ave", "Iconic integrated resort.", 4.7, 430, 8, []string{"WiFi", "Infinity Pool", "Casino", "SkyPark"}},
	{"The Ritz-Carlton Tokyo", "Tokyo", "9-7-1 Akasaka", "Luxury hotel in Roppongi district.", 4.8, 500, 7, []string{"WiFi", "Spa", "Japanese Restaurant"}},
	{"Park Hyatt Sydney", "Sydney", "7 Hickson Rd", "Stunning views of Sydney Harbour.", 4.6, 390, 9, []string{"WiFi", "Harbour View", "Pool", "Spa"}},
	{"W South Beach Miami", "Miami", "2201 Collins Ave", "Stylish hotel on South Beach.", 4.4, 280, 11, []string{"WiFi", "Pool", "Beach Club", "Spa"}},
	{"Loews Chicago Hotel", "Chicago", "455 N Park Dr", "Modern hotel in Streeterville.", 4.3, 240, 10, []string{"WiFi", "Pool", "Fitness Center"}},
	{"Four Seasons New York", "New York", "57 E 57th St", "Ultra-luxury hotel in midtown.", 4.9, 600, 5, []string{"WiFi", "Spa", "Fine Dining", "Concierge"}},
	{"Chateau Marmont LA", "Los Angeles", "8221 Sunset Blvd", "Hollywood's legendary hotel.", 4.1, 310, 8, []string{"WiFi", "Pool", "Bar", "Garden"}},
	{"The Dorchester London", "London", "Park Ln, Mayfair", "Legendary five-star hotel.", 4.7, 520, 6, []string{"WiFi", "Spa", "Fine Dining", "Bar"}},
	{"Hotel Plaza Athenee Paris", "Paris", "25 Avenue Montaigne", "Palace hotel on Avenue Montaigne.", 4.8, 580, 5, []string{"WiFi", "Spa", "Bar", "Restaurant"}},
	{"Atlantis The Palm Dubai", "Dubai", "Crescent Rd, The Palm", "Resort on the iconic Palm Jumeirah.", 4.5, 380, 15, []string{"WiFi", "Aquapark", "Private Beach", "Spa"}},
	{"Capella Singapore", "Singapore", "1 The Knolls, Sentosa", "Colonial architecture on Sentosa Island.", 4.9, 620, 4, []string{"WiFi", "Private Beach", "3 Pools", "Spa"}},
	{"Mandarin Oriental Tokyo", "Tokyo", "2-1-1 Nihonbashi", "Contemporary luxury in Nihonbashi.", 4.8, 510, 6, []string{"WiFi", "Spa", "City Views", "Restaurant"}},
	{"InterContinental Sydney", "Sydney", "117 Macquarie St", "Landmark hotel in the CBD.", 4.5, 320, 9, []string{"WiFi", "Club Lounge", "Pool", "Restaurant"}},
	{"Faena Hotel Miami Beach", "Miami", "3201 Collins Ave", "Extravagant oceanfront hotel.", 4.6, 420, 7, []string{"WiFi", "Pool", "Cabaret", "Spa"}},
	{"Sofitel Chicago", "Chicago", "20 E Chestnut St", "French elegance on Magnificent Mile.", 4.2, 210, 11, []string{"WiFi", "Restaurant", "Bar", "Fitness"}},
}

func SeedAll() {
	seedFlights()
	seedHotels()
}

func seedFlights() {
	var count int64
	database.DB.Model(&models.Flight{}).Count(&count)
	if count > 0 {
		return
	}
	rng := rand.New(rand.NewSource(42))
	classes := []string{"economy", "business"}
	for i, route := range flightRoutes {
		origin, dest := route[0], route[1]
		airline := airlines[i%len(airlines)]
		departure := time.Now().Add(time.Duration(rng.Intn(30)+1) * 24 * time.Hour)
		durationHours := 1 + rng.Intn(14)
		arrival := departure.Add(time.Duration(durationHours) * time.Hour)
		price := math.Round((150.0+rng.Float64()*1050.0)*100) / 100

		database.DB.Create(&models.Flight{
			FlightNumber:   fmt.Sprintf("%s%d", airline[:2], 100+i),
			Airline:        airline,
			Origin:         origin,
			Destination:    dest,
			DepartureTime:  departure,
			ArrivalTime:    arrival,
			Duration:       fmt.Sprintf("%dh %dm", durationHours, rng.Intn(60)),
			Price:          price,
			AvailableSeats: 10 + rng.Intn(150),
			Class:          classes[rng.Intn(2)],
		})
	}
}

func seedHotels() {
	var count int64
	database.DB.Model(&models.Hotel{}).Count(&count)
	if count > 0 {
		return
	}
	for _, h := range hotels {
		database.DB.Create(&models.Hotel{
			Name:           h.Name,
			City:           h.City,
			Address:        h.Address,
			Rating:         h.Rating,
			PricePerNight:  h.Price,
			AvailableRooms: h.Rooms,
			Amenities:      models.StringSlice(h.Amenities),
			Images:         models.StringSlice([]string{"https://via.placeholder.com/400x300"}),
			Description:    h.Description,
		})
	}
}
