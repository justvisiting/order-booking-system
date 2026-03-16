package service

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"order-system/internal/model"
)

// mockProductRepo implements repository.ProductRepository for testing
type mockProductRepo struct {
	products   map[int64]*model.Product
	categories map[int64]*model.Category
	nextProdID int64
	nextCatID  int64
}

func newMockProductRepo() *mockProductRepo {
	return &mockProductRepo{
		products:   make(map[int64]*model.Product),
		categories: make(map[int64]*model.Category),
		nextProdID: 1,
		nextCatID:  1,
	}
}

func (m *mockProductRepo) ListActive(ctx context.Context) ([]model.Product, error) {
	var result []model.Product
	for _, p := range m.products {
		if p.IsActive {
			result = append(result, *p)
		}
	}
	return result, nil
}

func (m *mockProductRepo) GetByID(ctx context.Context, id int64) (*model.Product, error) {
	p, ok := m.products[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return p, nil
}

func (m *mockProductRepo) GetByIDs(ctx context.Context, ids []int64) ([]model.Product, error) {
	var result []model.Product
	for _, id := range ids {
		if p, ok := m.products[id]; ok && p.IsActive {
			result = append(result, *p)
		}
	}
	return result, nil
}

func (m *mockProductRepo) Create(ctx context.Context, p *model.Product) (int64, error) {
	id := m.nextProdID
	m.nextProdID++
	p.ID = id
	p.CreatedAt = time.Now()
	p.UpdatedAt = time.Now()
	m.products[id] = p
	return id, nil
}

func (m *mockProductRepo) Update(ctx context.Context, p *model.Product) error {
	m.products[p.ID] = p
	return nil
}

func (m *mockProductRepo) SoftDelete(ctx context.Context, id int64) error {
	if p, ok := m.products[id]; ok {
		p.IsActive = false
	}
	return nil
}

func (m *mockProductRepo) CreateCategory(ctx context.Context, c *model.Category) (int64, error) {
	id := m.nextCatID
	m.nextCatID++
	c.ID = id
	c.CreatedAt = time.Now()
	c.UpdatedAt = time.Now()
	m.categories[id] = c
	return id, nil
}

func (m *mockProductRepo) UpdateCategory(ctx context.Context, c *model.Category) error {
	m.categories[c.ID] = c
	return nil
}

func (m *mockProductRepo) GetCategoryByID(ctx context.Context, id int64) (*model.Category, error) {
	c, ok := m.categories[id]
	if !ok {
		return nil, sql.ErrNoRows
	}
	return c, nil
}

func TestProductService_CreateProduct(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	// Create category first
	cat, err := svc.CreateCategory(context.Background(), model.CreateCategoryRequest{
		Name: "Beverages",
		Slug: "beverages",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	product, err := svc.Create(context.Background(), model.CreateProductRequest{
		CategoryID:  cat.ID,
		Name:        "Cola",
		Description: "Refreshing cola drink",
		Price:       2.50,
		Unit:        "bottle",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if product.Name != "Cola" {
		t.Errorf("expected name Cola, got %s", product.Name)
	}
	if product.Price != 2.50 {
		t.Errorf("expected price 2.50, got %f", product.Price)
	}
}

func TestProductService_CreateProduct_InvalidCategory(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	_, err := svc.Create(context.Background(), model.CreateProductRequest{
		CategoryID: 999,
		Name:       "Cola",
		Price:      2.50,
	})
	if err != ErrCategoryNotFound {
		t.Errorf("expected ErrCategoryNotFound, got %v", err)
	}
}

func TestProductService_CreateProduct_InvalidPrice(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	_, err := svc.Create(context.Background(), model.CreateProductRequest{
		CategoryID: 1,
		Name:       "Cola",
		Price:      -1,
	})
	if err == nil {
		t.Error("expected error for negative price")
	}
}

func TestProductService_UpdateProduct(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	cat, _ := svc.CreateCategory(context.Background(), model.CreateCategoryRequest{Name: "Bev", Slug: "bev"})
	product, _ := svc.Create(context.Background(), model.CreateProductRequest{
		CategoryID: cat.ID, Name: "Cola", Price: 2.50, Unit: "bottle",
	})

	newName := "Diet Cola"
	newPrice := 3.00
	updated, err := svc.Update(context.Background(), product.ID, model.UpdateProductRequest{
		Name:  &newName,
		Price: &newPrice,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Name != "Diet Cola" {
		t.Errorf("expected name Diet Cola, got %s", updated.Name)
	}
	if updated.Price != 3.00 {
		t.Errorf("expected price 3.00, got %f", updated.Price)
	}
}

func TestProductService_SoftDelete(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	cat, _ := svc.CreateCategory(context.Background(), model.CreateCategoryRequest{Name: "Food", Slug: "food"})
	product, _ := svc.Create(context.Background(), model.CreateProductRequest{
		CategoryID: cat.ID, Name: "Burger", Price: 10.00,
	})

	err := svc.SoftDelete(context.Background(), product.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Product should still exist but be inactive
	p, _ := repo.GetByID(context.Background(), product.ID)
	if p.IsActive {
		t.Error("expected product to be inactive after soft delete")
	}
}

func TestProductService_GetByID_NotFound(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	_, err := svc.GetByID(context.Background(), 999)
	if err != ErrProductNotFound {
		t.Errorf("expected ErrProductNotFound, got %v", err)
	}
}

func TestProductService_ListActive(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	cat, _ := svc.CreateCategory(context.Background(), model.CreateCategoryRequest{Name: "Food", Slug: "food"})
	svc.Create(context.Background(), model.CreateProductRequest{CategoryID: cat.ID, Name: "A", Price: 1.0})
	svc.Create(context.Background(), model.CreateProductRequest{CategoryID: cat.ID, Name: "B", Price: 2.0})

	products, err := svc.ListActive(context.Background())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(products) != 2 {
		t.Errorf("expected 2 products, got %d", len(products))
	}
}

func TestProductService_CreateCategory(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	cat, err := svc.CreateCategory(context.Background(), model.CreateCategoryRequest{
		Name: "Electronics",
		Slug: "electronics",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if cat.Name != "Electronics" {
		t.Errorf("expected name Electronics, got %s", cat.Name)
	}
}

func TestProductService_UpdateCategory(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	cat, _ := svc.CreateCategory(context.Background(), model.CreateCategoryRequest{Name: "Bev", Slug: "bev"})
	newName := "Beverages"
	updated, err := svc.UpdateCategory(context.Background(), cat.ID, model.UpdateCategoryRequest{Name: &newName})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.Name != "Beverages" {
		t.Errorf("expected name Beverages, got %s", updated.Name)
	}
}

func TestProductService_UpdateCategory_NotFound(t *testing.T) {
	repo := newMockProductRepo()
	svc := NewProductService(repo)

	newName := "Test"
	_, err := svc.UpdateCategory(context.Background(), 999, model.UpdateCategoryRequest{Name: &newName})
	if err != ErrCategoryNotFound {
		t.Errorf("expected ErrCategoryNotFound, got %v", err)
	}
}
