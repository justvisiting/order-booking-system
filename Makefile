.PHONY: build run test clean

build:
	go build -o order-system ./cmd/server

run: build
	./order-system

test:
	go test -v -race ./...

clean:
	rm -f order-system

lint:
	golangci-lint run ./...

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f
