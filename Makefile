.PHONY: dev
dev: clean prepare build help

.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make prepare - Clone example from Moleculer starter"
	@echo "  make build - Build project"
	@echo "  make repl - Start REPL"
	@echo "  make clean - Clean project"

.PHONY: prepare
prepare:
	@echo "Preparing..."
	@echo "Clone example from Moleculer starter..."
	@git clone https://github.com/jellydn/moleculer-typescript-template.git tmp
	@echo "Install dependencies..."
	@cd tmp && pnpm install
	@rm -rf tmp/.git
	@echo "Done."

.PHONY: build
build:
	@echo "Building..."
	@npm run build
	@echo "Done."

.PHONY: repl
repl:
	@echo "Starting REPL..."
	NODE_OPTIONS='--import tsx' node dist/cli.js --config ./tmp/moleculer.config.ts
	@echo "Done."

.PHONY: clean
clean:
	@echo "Cleaning..."
	@rm -rf tmp
	@rm -rf dist
	@echo "Done."
