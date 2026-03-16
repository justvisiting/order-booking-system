package service

import (
	"context"
	"database/sql"
	"errors"

	"order-system/internal/model"
	"order-system/internal/repository"
)

var (
	ErrProductNotFound  = errors.New("product not found")
	ErrCategoryNotFound = errors.New("category not found")
)

type ProductService interface {
	ListActive(ctx context.Context) ([]model.Product, error)
	GetByID(ctx context.Context, id int64) (*model.Product, error)
	Create(ctx context.Context, req model.CreateProductRequest) (*model.Product, error)
	Update(ctx context.Context, id int64, req model.UpdateProductRequest) (*model.Product, error)
	SoftDelete(ctx context.Context, id int64) error
	CreateCategory(ctx context.Context, req model.CreateCategoryRequest) (*model.Category, error)
	UpdateCategory(ctx context.Context, id int64, req model.UpdateCategoryRequest) (*model.Category, error)
}

type productService struct {
	repo repository.ProductRepository
}

func NewProductService(repo repository.ProductRepository) ProductService {
	return &productService{repo: repo}
}

func (s *productService) ListActive(ctx context.Context) ([]model.Product, error) {
	return s.repo.ListActive(ctx)
}

func (s *productService) GetByID(ctx context.Context, id int64) (*model.Product, error) {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}
	return p, nil
}

func (s *productService) Create(ctx context.Context, req model.CreateProductRequest) (*model.Product, error) {
	if req.Name == "" {
		return nil, errors.New("product name is required")
	}
	if req.Price <= 0 {
		return nil, errors.New("price must be positive")
	}
	if req.CategoryID <= 0 {
		return nil, errors.New("category_id is required")
	}

	// Verify category exists
	_, err := s.repo.GetCategoryByID(ctx, req.CategoryID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}

	product := &model.Product{
		CategoryID:  req.CategoryID,
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Unit:        req.Unit,
		IsActive:    true,
	}

	id, err := s.repo.Create(ctx, product)
	if err != nil {
		return nil, err
	}
	product.ID = id
	return product, nil
}

func (s *productService) Update(ctx context.Context, id int64, req model.UpdateProductRequest) (*model.Product, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrProductNotFound
		}
		return nil, err
	}

	if req.Name != nil {
		existing.Name = *req.Name
	}
	if req.Description != nil {
		existing.Description = *req.Description
	}
	if req.Price != nil {
		if *req.Price <= 0 {
			return nil, errors.New("price must be positive")
		}
		existing.Price = *req.Price
	}
	if req.Unit != nil {
		existing.Unit = *req.Unit
	}
	if req.CategoryID != nil {
		_, err := s.repo.GetCategoryByID(ctx, *req.CategoryID)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil, ErrCategoryNotFound
			}
			return nil, err
		}
		existing.CategoryID = *req.CategoryID
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *productService) SoftDelete(ctx context.Context, id int64) error {
	_, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrProductNotFound
		}
		return err
	}
	return s.repo.SoftDelete(ctx, id)
}

func (s *productService) CreateCategory(ctx context.Context, req model.CreateCategoryRequest) (*model.Category, error) {
	if req.Name == "" {
		return nil, errors.New("category name is required")
	}
	if req.Slug == "" {
		return nil, errors.New("category slug is required")
	}

	cat := &model.Category{
		Name: req.Name,
		Slug: req.Slug,
	}
	id, err := s.repo.CreateCategory(ctx, cat)
	if err != nil {
		return nil, err
	}
	cat.ID = id
	return cat, nil
}

func (s *productService) UpdateCategory(ctx context.Context, id int64, req model.UpdateCategoryRequest) (*model.Category, error) {
	existing, err := s.repo.GetCategoryByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrCategoryNotFound
		}
		return nil, err
	}
	if req.Name != nil {
		existing.Name = *req.Name
	}
	if req.Slug != nil {
		existing.Slug = *req.Slug
	}
	if err := s.repo.UpdateCategory(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}
