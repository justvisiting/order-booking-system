package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"os/exec"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	_ "github.com/go-sql-driver/mysql"
	"github.com/jmoiron/sqlx"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/testcontainers/testcontainers-go"
	tcmysql "github.com/testcontainers/testcontainers-go/modules/mysql"

	"order-system/internal/config"
	"order-system/internal/handler"
	"order-system/internal/middleware"
	"order-system/internal/model"
	"order-system/internal/repository"
	"order-system/internal/service"
	"order-system/internal/ws"
)

var (
	testServer *httptest.Server
	testDB     *sqlx.DB
)

func TestMain(m *testing.M) {
	// Check Docker availability before attempting to start containers.
	// If Docker is not accessible, skip all tests gracefully.
	if !isDockerAvailable() {
		log.Println("SKIP: Docker is not available — cannot run integration tests")
		os.Exit(0)
	}

	ctx := context.Background()

	// Start MySQL container
	mysqlC, err := tcmysql.Run(ctx, "mysql:8.0",
		tcmysql.WithDatabase("testdb"),
		tcmysql.WithUsername("root"),
		tcmysql.WithPassword("testpass"),
	)
	if err != nil {
		log.Fatalf("failed to start mysql container: %v", err)
	}
	defer func() {
		if err := testcontainers.TerminateContainer(mysqlC); err != nil {
			log.Printf("failed to terminate container: %v", err)
		}
	}()

	host, err := mysqlC.Host(ctx)
	if err != nil {
		log.Fatalf("failed to get container host: %v", err)
	}
	port, err := mysqlC.MappedPort(ctx, "3306")
	if err != nil {
		log.Fatalf("failed to get mapped port: %v", err)
	}

	dsn := fmt.Sprintf("root:testpass@tcp(%s:%s)/testdb?parseTime=true&multiStatements=true", host, port.Port())

	testDB, err = sqlx.Connect("mysql", dsn)
	if err != nil {
		log.Fatalf("failed to connect to test db: %v", err)
	}
	defer testDB.Close()

	// Wait for MySQL to be ready
	for i := 0; i < 30; i++ {
		if err := testDB.Ping(); err == nil {
			break
		}
		time.Sleep(time.Second)
	}

	// Run migrations
	if err := runMigrations(testDB); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	// Set up app
	testServer = setupServer(testDB)
	defer testServer.Close()

	os.Exit(m.Run())
}

func isDockerAvailable() bool {
	cmd := exec.Command("docker", "info")
	return cmd.Run() == nil
}

func runMigrations(db *sqlx.DB) error {
	// Read and execute migration files
	upSQL, err := os.ReadFile("../../migrations/001_create_tables.up.sql")
	if err != nil {
		return fmt.Errorf("read up migration: %w", err)
	}

	// The original migration is missing the delivery_address column.
	// Add it after creating the orders table.
	migrationSQL := string(upSQL) + "\nALTER TABLE orders ADD COLUMN delivery_address JSON NULL AFTER notes;\n"

	_, err = db.Exec(migrationSQL)
	if err != nil {
		return fmt.Errorf("exec up migration: %w", err)
	}

	seedSQL, err := os.ReadFile("../../migrations/002_seed_data.sql")
	if err != nil {
		return fmt.Errorf("read seed migration: %w", err)
	}
	_, err = db.Exec(string(seedSQL))
	if err != nil {
		return fmt.Errorf("exec seed migration: %w", err)
	}

	return nil
}

func setupServer(db *sqlx.DB) *httptest.Server {
	productRepo := repository.NewProductRepository(db)
	customerRepo := repository.NewCustomerRepository(db)
	orderRepo := repository.NewOrderRepository(db)
	userRepo := repository.NewUserRepository(db)

	hub := ws.NewHub()
	go hub.Run()

	jwtCfg := config.JWTConfig{
		Secret: "test-secret-key",
		Expiry: 24 * time.Hour,
	}
	corsCfg := config.CORSConfig{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Authorization", "Content-Type"},
	}

	authSvc := service.NewAuthService(userRepo, jwtCfg)
	productSvc := service.NewProductService(productRepo)
	orderSvc := service.NewOrderService(orderRepo, productRepo, customerRepo, hub)

	authHandler := handler.NewAuthHandler(authSvc)
	productHandler := handler.NewProductHandler(productSvc)
	orderHandler := handler.NewOrderHandler(orderSvc)
	adminHandler := handler.NewAdminHandler(productSvc, authSvc, customerRepo)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logging)
	r.Use(middleware.CORS(corsCfg))

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/products", productHandler.List)
		r.Get("/products/{id}", productHandler.GetByID)
		r.Post("/orders", orderHandler.PlaceOrder)
		r.Get("/orders/{id}", orderHandler.GetOrderStatus)
		r.Get("/customers/{phone}/orders", orderHandler.CustomerOrders)

		r.Post("/auth/login", authHandler.Login)

		r.Route("/dashboard", func(r chi.Router) {
			r.Use(middleware.Auth(authSvc))
			r.Use(middleware.RequireRole(model.UserRoleStaff, model.UserRoleAdmin))

			r.Get("/orders", orderHandler.DashboardListOrders)
			r.Get("/orders/{id}", orderHandler.DashboardGetOrder)
			r.Patch("/orders/{id}/status", orderHandler.UpdateStatus)
		})

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

	return httptest.NewServer(r)
}

// ----- Helper functions -----

func doGet(t *testing.T, path string, headers ...http.Header) *http.Response {
	t.Helper()
	url := testServer.URL + path
	req, err := http.NewRequest(http.MethodGet, url, nil)
	require.NoError(t, err)
	if len(headers) > 0 {
		req.Header = headers[0]
	}
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	return resp
}

func doPost(t *testing.T, path string, body interface{}, headers ...http.Header) *http.Response {
	t.Helper()
	url := testServer.URL + path
	b, err := json.Marshal(body)
	require.NoError(t, err)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(b))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	if len(headers) > 0 {
		for k, v := range headers[0] {
			req.Header[k] = v
		}
	}
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	return resp
}

func doPut(t *testing.T, path string, body interface{}, headers ...http.Header) *http.Response {
	t.Helper()
	url := testServer.URL + path
	b, err := json.Marshal(body)
	require.NoError(t, err)
	req, err := http.NewRequest(http.MethodPut, url, bytes.NewReader(b))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	if len(headers) > 0 {
		for k, v := range headers[0] {
			req.Header[k] = v
		}
	}
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	return resp
}

func doDelete(t *testing.T, path string, headers ...http.Header) *http.Response {
	t.Helper()
	url := testServer.URL + path
	req, err := http.NewRequest(http.MethodDelete, url, nil)
	require.NoError(t, err)
	if len(headers) > 0 {
		req.Header = headers[0]
	}
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	return resp
}

func doPatch(t *testing.T, path string, body interface{}, headers ...http.Header) *http.Response {
	t.Helper()
	url := testServer.URL + path
	b, err := json.Marshal(body)
	require.NoError(t, err)
	req, err := http.NewRequest(http.MethodPatch, url, bytes.NewReader(b))
	require.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")
	if len(headers) > 0 {
		for k, v := range headers[0] {
			req.Header[k] = v
		}
	}
	resp, err := http.DefaultClient.Do(req)
	require.NoError(t, err)
	return resp
}

func readBody(t *testing.T, resp *http.Response) map[string]interface{} {
	t.Helper()
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	var result map[string]interface{}
	err = json.Unmarshal(b, &result)
	require.NoError(t, err, "body: %s", string(b))
	return result
}

func readBodyRaw(t *testing.T, resp *http.Response) []byte {
	t.Helper()
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	return b
}

func loginAs(t *testing.T, username, password string) string {
	t.Helper()
	resp := doPost(t, "/api/v1/auth/login", map[string]string{
		"username": username,
		"password": password,
	})
	require.Equal(t, http.StatusOK, resp.StatusCode)
	body := readBody(t, resp)
	token, ok := body["token"].(string)
	require.True(t, ok, "login response should contain token")
	return token
}

func authHeader(token string) http.Header {
	h := http.Header{}
	h.Set("Authorization", "Bearer "+token)
	return h
}

// ----- Tests -----

func TestListProducts(t *testing.T) {
	resp := doGet(t, "/api/v1/products")
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := readBody(t, resp)

	// Verify top-level structure
	products, ok := body["products"].([]interface{})
	require.True(t, ok, "response should have 'products' array")
	assert.GreaterOrEqual(t, len(products), 15, "should have at least 15 seeded products")

	// Verify product field names
	p := products[0].(map[string]interface{})
	assert.Contains(t, p, "id")
	assert.Contains(t, p, "name")
	assert.Contains(t, p, "price")
	assert.Contains(t, p, "unit")
	assert.Contains(t, p, "is_active")
	assert.Contains(t, p, "category_id")
	assert.Contains(t, p, "description")
}

func TestCreateOrder(t *testing.T) {
	orderReq := map[string]interface{}{
		"customer": map[string]interface{}{
			"name":  "Test Customer",
			"phone": "9876543210",
		},
		"items": []map[string]interface{}{
			{"product_id": 1, "quantity": 2},
			{"product_id": 5, "quantity": 1},
		},
		"notes": "Test order",
		"delivery_address": map[string]interface{}{
			"address": "123 Test St",
			"city":    "TestCity",
			"state":   "TestState",
			"pincode": "123456",
		},
	}

	resp := doPost(t, "/api/v1/orders", orderReq)
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	body := readBody(t, resp)

	// Verify order response field names
	assert.Contains(t, body, "id")
	assert.Contains(t, body, "order_number")
	assert.Contains(t, body, "customer_name")
	assert.Contains(t, body, "status")
	assert.Contains(t, body, "total_amount")
	assert.Contains(t, body, "items")

	// Verify order_number format
	orderNum, ok := body["order_number"].(string)
	require.True(t, ok)
	assert.True(t, strings.HasPrefix(orderNum, "ORD-"), "order_number should start with ORD-")

	// Verify status is pending
	assert.Equal(t, "pending", body["status"])

	// Verify items
	items, ok := body["items"].([]interface{})
	require.True(t, ok, "response should have items array")
	assert.Equal(t, 2, len(items))

	item := items[0].(map[string]interface{})
	assert.Contains(t, item, "product_id")
	assert.Contains(t, item, "product_name")
	assert.Contains(t, item, "quantity")
	assert.Contains(t, item, "unit_price")
	assert.Contains(t, item, "subtotal")
}

func TestCreateOrderValidation(t *testing.T) {
	// Empty items
	resp := doPost(t, "/api/v1/orders", map[string]interface{}{
		"customer": map[string]interface{}{
			"name":  "Test",
			"phone": "1111111111",
		},
		"items": []map[string]interface{}{},
	})
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	resp.Body.Close()
}

func TestListOrders_Dashboard(t *testing.T) {
	// First create an order so there's at least one
	orderReq := map[string]interface{}{
		"customer": map[string]interface{}{
			"name":  "Dashboard Test",
			"phone": "5555555550",
		},
		"items": []map[string]interface{}{
			{"product_id": 2, "quantity": 3},
		},
	}
	resp := doPost(t, "/api/v1/orders", orderReq)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	resp.Body.Close()

	// Login as staff to access dashboard
	token := loginAs(t, "staff", "admin123")

	// List orders via dashboard endpoint
	resp = doGet(t, "/api/v1/dashboard/orders", authHeader(token))
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := readBody(t, resp)

	// Verify paginated response structure
	orders, ok := body["orders"].([]interface{})
	require.True(t, ok, "response should have 'orders' array")
	assert.GreaterOrEqual(t, len(orders), 1)

	assert.Contains(t, body, "total")
	assert.Contains(t, body, "page")
	assert.Contains(t, body, "per_page")

	// Verify order shape
	o := orders[0].(map[string]interface{})
	assert.Contains(t, o, "id")
	assert.Contains(t, o, "order_number")
	assert.Contains(t, o, "customer_name")
	assert.Contains(t, o, "customer_phone")
	assert.Contains(t, o, "status")
	assert.Contains(t, o, "total_amount")
}

func TestListOrders_DashboardRequiresAuth(t *testing.T) {
	resp := doGet(t, "/api/v1/dashboard/orders")
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	resp.Body.Close()
}

func TestUpdateOrderStatus(t *testing.T) {
	// Create an order
	orderReq := map[string]interface{}{
		"customer": map[string]interface{}{
			"name":  "Status Test",
			"phone": "7777777770",
		},
		"items": []map[string]interface{}{
			{"product_id": 3, "quantity": 1},
		},
	}
	resp := doPost(t, "/api/v1/orders", orderReq)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	orderBody := readBody(t, resp)
	orderID := orderBody["id"].(float64)

	// Login as staff
	token := loginAs(t, "staff", "admin123")

	// Update status: pending -> confirmed
	statusReq := map[string]interface{}{
		"status": "confirmed",
		"note":   "Order confirmed by staff",
	}
	resp = doPatch(t, fmt.Sprintf("/api/v1/dashboard/orders/%d/status", int(orderID)), statusReq, authHeader(token))
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := readBody(t, resp)
	assert.Equal(t, "confirmed", body["status"])
	assert.Contains(t, body, "order_number")

	// Update status: confirmed -> dispatched
	statusReq["status"] = "dispatched"
	statusReq["note"] = "Out for delivery"
	resp = doPatch(t, fmt.Sprintf("/api/v1/dashboard/orders/%d/status", int(orderID)), statusReq, authHeader(token))
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	body = readBody(t, resp)
	assert.Equal(t, "dispatched", body["status"])
}

func TestUpdateOrderStatus_InvalidTransition(t *testing.T) {
	// Create an order
	orderReq := map[string]interface{}{
		"customer": map[string]interface{}{
			"name":  "Invalid Transition",
			"phone": "6666666660",
		},
		"items": []map[string]interface{}{
			{"product_id": 4, "quantity": 1},
		},
	}
	resp := doPost(t, "/api/v1/orders", orderReq)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	orderBody := readBody(t, resp)
	orderID := orderBody["id"].(float64)

	token := loginAs(t, "staff", "admin123")

	// Try invalid transition: pending -> delivered (should be pending -> confirmed first)
	statusReq := map[string]interface{}{
		"status": "delivered",
	}
	resp = doPatch(t, fmt.Sprintf("/api/v1/dashboard/orders/%d/status", int(orderID)), statusReq, authHeader(token))
	assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)
	resp.Body.Close()
}

func TestAuthLogin(t *testing.T) {
	t.Run("valid admin login", func(t *testing.T) {
		resp := doPost(t, "/api/v1/auth/login", map[string]string{
			"username": "admin",
			"password": "admin123",
		})
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := readBody(t, resp)
		assert.Contains(t, body, "token")
		assert.Contains(t, body, "user")

		user := body["user"].(map[string]interface{})
		assert.Equal(t, "admin", user["username"])
		assert.Equal(t, "admin", user["role"])
		assert.Contains(t, user, "is_active")
		// password_hash should NOT be in the response (json:"-")
		assert.NotContains(t, user, "password_hash")
	})

	t.Run("valid staff login", func(t *testing.T) {
		resp := doPost(t, "/api/v1/auth/login", map[string]string{
			"username": "staff",
			"password": "admin123",
		})
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body := readBody(t, resp)
		user := body["user"].(map[string]interface{})
		assert.Equal(t, "staff", user["role"])
	})

	t.Run("invalid credentials", func(t *testing.T) {
		resp := doPost(t, "/api/v1/auth/login", map[string]string{
			"username": "admin",
			"password": "wrongpassword",
		})
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
		resp.Body.Close()
	})

	t.Run("nonexistent user", func(t *testing.T) {
		resp := doPost(t, "/api/v1/auth/login", map[string]string{
			"username": "nonexistent",
			"password": "test",
		})
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
		resp.Body.Close()
	})
}

func TestGetOrderStatus_Public(t *testing.T) {
	// Create an order first
	orderReq := map[string]interface{}{
		"customer": map[string]interface{}{
			"name":  "Public Check",
			"phone": "8888888880",
		},
		"items": []map[string]interface{}{
			{"product_id": 1, "quantity": 1},
		},
	}
	resp := doPost(t, "/api/v1/orders", orderReq)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	orderBody := readBody(t, resp)
	orderID := orderBody["id"].(float64)

	// Get order status with phone
	resp = doGet(t, fmt.Sprintf("/api/v1/orders/%d?phone=8888888880", int(orderID)))
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	body := readBody(t, resp)
	assert.Contains(t, body, "order_number")
	assert.Contains(t, body, "status")
	assert.Equal(t, "pending", body["status"])
}

func TestGetOrderStatus_MissingPhone(t *testing.T) {
	resp := doGet(t, "/api/v1/orders/1")
	assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	resp.Body.Close()
}

func TestCustomerOrders(t *testing.T) {
	phone := "3333333330"
	// Create two orders for same customer
	for i := 0; i < 2; i++ {
		orderReq := map[string]interface{}{
			"customer": map[string]interface{}{
				"name":  "Multi Order Customer",
				"phone": phone,
			},
			"items": []map[string]interface{}{
				{"product_id": 1, "quantity": i + 1},
			},
		}
		resp := doPost(t, "/api/v1/orders", orderReq)
		require.Equal(t, http.StatusCreated, resp.StatusCode)
		resp.Body.Close()
	}

	resp := doGet(t, fmt.Sprintf("/api/v1/customers/%s/orders", phone))
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := readBody(t, resp)
	orders, ok := body["orders"].([]interface{})
	require.True(t, ok)
	assert.GreaterOrEqual(t, len(orders), 2)
	assert.Contains(t, body, "total")
	assert.Contains(t, body, "page")
	assert.Contains(t, body, "per_page")
}

func TestGetProductByID(t *testing.T) {
	resp := doGet(t, "/api/v1/products/1")
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := readBody(t, resp)
	assert.Contains(t, body, "id")
	assert.Contains(t, body, "name")
	assert.Contains(t, body, "is_active")
	assert.Contains(t, body, "category_id")
	assert.Contains(t, body, "unit")
	assert.Contains(t, body, "price")
}

func TestGetProductByID_NotFound(t *testing.T) {
	resp := doGet(t, "/api/v1/products/99999")
	assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	resp.Body.Close()
}

func TestDashboardFilterByStatus(t *testing.T) {
	token := loginAs(t, "staff", "admin123")

	resp := doGet(t, "/api/v1/dashboard/orders?status=pending", authHeader(token))
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := readBody(t, resp)
	orders := body["orders"].([]interface{})
	for _, o := range orders {
		order := o.(map[string]interface{})
		assert.Equal(t, "pending", order["status"])
	}
}

func TestAdminCreateProduct(t *testing.T) {
	token := loginAs(t, "admin", "admin123")

	productReq := map[string]interface{}{
		"category_id": 1,
		"name":        "Integration Test Fruit",
		"description": "Created during integration test",
		"price":       99.50,
		"unit":        "kg",
	}

	resp := doPost(t, "/api/v1/admin/products", productReq, authHeader(token))
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	body := readBody(t, resp)
	assert.Contains(t, body, "id")
	assert.Equal(t, "Integration Test Fruit", body["name"])
	assert.Contains(t, body, "is_active")
	assert.Contains(t, body, "category_id")
}

func TestAdminRequiresAdminRole(t *testing.T) {
	// Staff user should be forbidden from admin endpoints
	token := loginAs(t, "staff", "admin123")

	resp := doPost(t, "/api/v1/admin/products", map[string]interface{}{
		"category_id": 1,
		"name":        "Should Fail",
		"description": "Nope",
		"price":       10.0,
		"unit":        "kg",
	}, authHeader(token))
	assert.Equal(t, http.StatusForbidden, resp.StatusCode)
	resp.Body.Close()
}

func TestFullOrderLifecycle(t *testing.T) {
	// 1. List products to find what's available
	resp := doGet(t, "/api/v1/products")
	require.Equal(t, http.StatusOK, resp.StatusCode)
	productsBody := readBody(t, resp)
	products := productsBody["products"].([]interface{})
	require.GreaterOrEqual(t, len(products), 1)
	firstProduct := products[0].(map[string]interface{})
	productID := firstProduct["id"].(float64)

	// 2. Place an order
	orderReq := map[string]interface{}{
		"customer": map[string]interface{}{
			"name":  "Lifecycle Customer",
			"phone": "4444444440",
		},
		"items": []map[string]interface{}{
			{"product_id": int(productID), "quantity": 5},
		},
		"delivery_address": map[string]interface{}{
			"address": "456 Lifecycle Ave",
			"city":    "TestTown",
			"state":   "TestState",
			"pincode": "654321",
		},
	}
	resp = doPost(t, "/api/v1/orders", orderReq)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	orderBody := readBody(t, resp)
	orderID := int(orderBody["id"].(float64))

	// 3. Check order status publicly
	resp = doGet(t, fmt.Sprintf("/api/v1/orders/%d?phone=4444444440", orderID))
	require.Equal(t, http.StatusOK, resp.StatusCode)
	statusBody := readBody(t, resp)
	assert.Equal(t, "pending", statusBody["status"])

	// 4. Login as staff
	token := loginAs(t, "staff", "admin123")

	// 5. View on dashboard
	resp = doGet(t, fmt.Sprintf("/api/v1/dashboard/orders/%d", orderID), authHeader(token))
	require.Equal(t, http.StatusOK, resp.StatusCode)
	dashBody := readBody(t, resp)
	assert.Equal(t, "pending", dashBody["status"])
	assert.Contains(t, dashBody, "items")
	assert.Contains(t, dashBody, "delivery_address")

	// 6. Progress through statuses: pending -> confirmed -> dispatched -> delivered
	for _, status := range []string{"confirmed", "dispatched", "delivered"} {
		resp = doPatch(t, fmt.Sprintf("/api/v1/dashboard/orders/%d/status", orderID),
			map[string]interface{}{"status": status, "note": "Progressing to " + status},
			authHeader(token))
		require.Equal(t, http.StatusOK, resp.StatusCode)
		body := readBody(t, resp)
		assert.Equal(t, status, body["status"])
	}

	// 7. Verify final status publicly
	resp = doGet(t, fmt.Sprintf("/api/v1/orders/%d?phone=4444444440", orderID))
	require.Equal(t, http.StatusOK, resp.StatusCode)
	finalBody := readBody(t, resp)
	assert.Equal(t, "delivered", finalBody["status"])
}

func TestAdminUpdateProduct(t *testing.T) {
	token := loginAs(t, "admin", "admin123")

	// Create a product to update
	createReq := map[string]interface{}{
		"category_id": 2,
		"name":        "Update Test Veggie",
		"description": "Before update",
		"price":       50.00,
		"unit":        "kg",
	}
	resp := doPost(t, "/api/v1/admin/products", createReq, authHeader(token))
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	body := readBody(t, resp)
	productID := int(body["id"].(float64))

	// Update the product
	newName := "Updated Veggie"
	newPrice := 75.50
	updateReq := map[string]interface{}{
		"name":  newName,
		"price": newPrice,
	}
	resp = doPut(t, fmt.Sprintf("/api/v1/admin/products/%d", productID), updateReq, authHeader(token))
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body = readBody(t, resp)
	assert.Equal(t, newName, body["name"])
	assert.Equal(t, newPrice, body["price"])
	// category_id should remain unchanged
	assert.Equal(t, float64(2), body["category_id"])
}

func TestAdminDeleteProduct(t *testing.T) {
	token := loginAs(t, "admin", "admin123")

	// Create a product to delete
	createReq := map[string]interface{}{
		"category_id": 1,
		"name":        "Delete Test Product",
		"description": "Will be soft deleted",
		"price":       10.00,
		"unit":        "piece",
	}
	resp := doPost(t, "/api/v1/admin/products", createReq, authHeader(token))
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	body := readBody(t, resp)
	productID := int(body["id"].(float64))

	// Delete (soft)
	resp = doDelete(t, fmt.Sprintf("/api/v1/admin/products/%d", productID), authHeader(token))
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	resp.Body.Close()

	// Product should no longer appear in active list
	resp = doGet(t, "/api/v1/products")
	require.Equal(t, http.StatusOK, resp.StatusCode)
	productsBody := readBody(t, resp)
	products := productsBody["products"].([]interface{})
	for _, p := range products {
		prod := p.(map[string]interface{})
		assert.NotEqual(t, float64(productID), prod["id"], "soft-deleted product should not appear in active list")
	}
}

func TestAdminCreateCategory(t *testing.T) {
	token := loginAs(t, "admin", "admin123")

	catReq := map[string]interface{}{
		"name": "Test Category",
		"slug": "test-category",
	}
	resp := doPost(t, "/api/v1/admin/categories", catReq, authHeader(token))
	assert.Equal(t, http.StatusCreated, resp.StatusCode)

	body := readBody(t, resp)
	assert.Contains(t, body, "id")
	assert.Equal(t, "Test Category", body["name"])
	assert.Equal(t, "test-category", body["slug"])
}

func TestAdminUpdateCategory(t *testing.T) {
	token := loginAs(t, "admin", "admin123")

	// Create a category first
	catReq := map[string]interface{}{
		"name": "Cat To Update",
		"slug": "cat-to-update",
	}
	resp := doPost(t, "/api/v1/admin/categories", catReq, authHeader(token))
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	body := readBody(t, resp)
	catID := int(body["id"].(float64))

	// Update it
	newName := "Updated Category"
	updateReq := map[string]interface{}{
		"name": newName,
	}
	resp = doPut(t, fmt.Sprintf("/api/v1/admin/categories/%d", catID), updateReq, authHeader(token))
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body = readBody(t, resp)
	assert.Equal(t, newName, body["name"])
	assert.Equal(t, "cat-to-update", body["slug"]) // slug unchanged
}

func TestAdminCreateUser(t *testing.T) {
	token := loginAs(t, "admin", "admin123")

	t.Run("create staff user", func(t *testing.T) {
		userReq := map[string]interface{}{
			"username": "newstaff",
			"password": "password123",
			"role":     "staff",
		}
		resp := doPost(t, "/api/v1/admin/users", userReq, authHeader(token))
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		body := readBody(t, resp)
		assert.Equal(t, "newstaff", body["username"])
		assert.Equal(t, "staff", body["role"])
		assert.NotContains(t, body, "password_hash")
	})

	t.Run("duplicate username", func(t *testing.T) {
		userReq := map[string]interface{}{
			"username": "admin",
			"password": "password123",
			"role":     "staff",
		}
		resp := doPost(t, "/api/v1/admin/users", userReq, authHeader(token))
		assert.Equal(t, http.StatusConflict, resp.StatusCode)
		resp.Body.Close()
	})

	t.Run("new user can login", func(t *testing.T) {
		newToken := loginAs(t, "newstaff", "password123")
		assert.NotEmpty(t, newToken)
	})
}

func TestAuthTokenValidation(t *testing.T) {
	t.Run("invalid token", func(t *testing.T) {
		h := http.Header{}
		h.Set("Authorization", "Bearer invalid-token-here")
		resp := doGet(t, "/api/v1/dashboard/orders", h)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
		resp.Body.Close()
	})

	t.Run("missing authorization header", func(t *testing.T) {
		resp := doGet(t, "/api/v1/dashboard/orders")
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
		resp.Body.Close()
	})

	t.Run("valid token grants access", func(t *testing.T) {
		token := loginAs(t, "staff", "admin123")
		resp := doGet(t, "/api/v1/dashboard/orders", authHeader(token))
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		resp.Body.Close()
	})
}

func TestOrderCancellation(t *testing.T) {
	// Create an order
	orderReq := map[string]interface{}{
		"customer": map[string]interface{}{
			"name":  "Cancel Test",
			"phone": "1112223330",
		},
		"items": []map[string]interface{}{
			{"product_id": 1, "quantity": 1},
		},
	}
	resp := doPost(t, "/api/v1/orders", orderReq)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	orderBody := readBody(t, resp)
	orderID := int(orderBody["id"].(float64))

	token := loginAs(t, "staff", "admin123")

	// Cancel the pending order
	resp = doPatch(t, fmt.Sprintf("/api/v1/dashboard/orders/%d/status", orderID),
		map[string]interface{}{"status": "cancelled", "note": "Customer requested cancellation"},
		authHeader(token))
	assert.Equal(t, http.StatusOK, resp.StatusCode)
	body := readBody(t, resp)
	assert.Equal(t, "cancelled", body["status"])

	// Cannot transition from cancelled
	resp = doPatch(t, fmt.Sprintf("/api/v1/dashboard/orders/%d/status", orderID),
		map[string]interface{}{"status": "confirmed"},
		authHeader(token))
	assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)
	resp.Body.Close()
}

func TestAdminListCustomers(t *testing.T) {
	token := loginAs(t, "admin", "admin123")

	// Ensure at least one customer exists by placing an order
	orderReq := map[string]interface{}{
		"customer": map[string]interface{}{
			"name":  "Customer List Test",
			"phone": "2223334440",
		},
		"items": []map[string]interface{}{
			{"product_id": 1, "quantity": 1},
		},
	}
	resp := doPost(t, "/api/v1/orders", orderReq)
	require.Equal(t, http.StatusCreated, resp.StatusCode)
	resp.Body.Close()

	// List customers
	resp = doGet(t, "/api/v1/admin/customers", authHeader(token))
	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body := readBody(t, resp)
	customers, ok := body["customers"].([]interface{})
	require.True(t, ok)
	assert.GreaterOrEqual(t, len(customers), 1)
	assert.Contains(t, body, "total")
	assert.Contains(t, body, "page")
	assert.Contains(t, body, "per_page")

	// Verify customer shape
	c := customers[0].(map[string]interface{})
	assert.Contains(t, c, "id")
	assert.Contains(t, c, "name")
	assert.Contains(t, c, "phone")
}
