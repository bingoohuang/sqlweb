.PHONY: default test
all: default test

default:
	go fmt ./...&&revive .&&goimports -w .&&golangci-lint run --enable-all&&go install -ldflags="-s -w" ./...

install:
	go install -ldflags="-s -w" ./...

test:
	go test ./...
