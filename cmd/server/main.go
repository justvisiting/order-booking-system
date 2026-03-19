package main

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"

	"order-system/internal/config"
	"order-system/internal/handler"
	"order-system/internal/middleware"
	"order-system/internal/model"
	"order-system/internal/repository"
	"order-system/internal/service"
	"order-system/internal/ws"
)

func main() {
	cfgPath := "config.yaml"
	if v := os.Getenv("CONFIG_PATH"); v != "" {
		cfgPath = v
	}

	cfg, err := config.Load(cfgPath)
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	// Initialize structured logger
	logLevel := cfg.Log.SlogLevel()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))
	slog.SetDefault(logger)

	slog.Info("config loaded", "log_level", cfg.Log.Level)

	// Connect to MySQL
	db, err := sqlx.Connect("mysql", cfg.Database.DSN())
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	db.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	db.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	db.SetConnMaxLifetime(cfg.Database.ConnMaxLifetime)

	slog.Info("database connected", "host", cfg.Database.Host, "name", cfg.Database.Name)

	// Repositories
	productRepo := repository.NewProductRepository(db)
	customerRepo := repository.NewCustomerRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	userRepo := repository.NewUserRepository(db)

	// WebSocket hub
	hub := ws.NewHub()
	go hub.Run()

	// Services
	authSvc := service.NewAuthService(userRepo, cfg.JWT)
	productSvc := service.NewProductService(productRepo)
	orderSvc := service.NewOrderService(orderRepo, productRepo, customerRepo, hub)

	// Handlers
	authHandler := handler.NewAuthHandler(authSvc)
	productHandler := handler.NewProductHandler(productSvc)
	orderHandler := handler.NewOrderHandler(orderSvc)
	adminHandler := handler.NewAdminHandler(productSvc, authSvc, customerRepo)

	// Router
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logging)
	r.Use(middleware.CORS(cfg.CORS))

	r.Route("/api/v1", func(r chi.Router) {
		// Public endpoints
		r.Get("/products", productHandler.List)
		r.Get("/products/{id}", productHandler.GetByID)
		r.Post("/orders", orderHandler.PlaceOrder)
		r.Get("/orders/{id}", orderHandler.GetOrderStatus)
		r.Get("/customers/{phone}/orders", orderHandler.CustomerOrders)

		// Auth
		r.Post("/auth/login", authHandler.Login)

		// Dashboard (staff + admin)
		r.Route("/dashboard", func(r chi.Router) {
			r.Use(middleware.Auth(authSvc))
			r.Use(middleware.RequireRole(model.UserRoleStaff, model.UserRoleAdmin))

			r.Get("/orders", orderHandler.DashboardListOrders)
			r.Get("/orders/{id}", orderHandler.DashboardGetOrder)
			r.Patch("/orders/{id}/status", orderHandler.UpdateStatus)

			r.HandleFunc("/ws", hub.HandleWS)
		})

		// Admin
		r.Route("/admin", func(r chi.Router) {
			r.Use(middleware.Auth(authSvc))
			r.Use(middleware.RequireRole(model.UserRoleAdmin))

			r.Post("/products", adminHandler.CreateProduct)
			r.Put("/products/{id}", adminHandler.UpdateProduct)
			r.Delete("/products/{id}", adminHandler.DeleteProduct)
			r.Post("/categories", adminHandler.CreateCategory)
			r.Put("/categories/{id}", adminHandler.UpdateCategory)
			r.Get("/customers", adminHandler.ListCustomers)
			r.Post("/users", adminHandler.CreateUser)
		})
	})

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  60 * time.Second,
	}

	slog.Info("server starting", "addr", addr)
	if err := srv.ListenAndServe(); err != nil {
		slog.Error("server error", "error", err)
		os.Exit(1)
	}
}
