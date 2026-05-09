.DEFAULT_GOAL := help
.PHONY: help setup install install-js install-rust dev build build-ui \
	typecheck typecheck-js typecheck-rust \
	lint lint-js lint-rust \
	fmt fmt-js fmt-rust fmt-check fmt-check-js fmt-check-rust \
	test test-js test-rust verify check clean reset

PNPM ?= pnpm
CARGO ?= cargo
TAURI_DIR := src-tauri

help: ## Show available targets
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make <target>\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

setup: install ## Full from-scratch setup (deps + sanity checks)
	@command -v $(PNPM) >/dev/null 2>&1 || { echo "pnpm not found. Install: npm i -g pnpm"; exit 1; }
	@command -v $(CARGO) >/dev/null 2>&1 || { echo "cargo not found. Install Rust: https://rustup.rs"; exit 1; }
	@echo "Setup complete. Run 'make dev' to start."

install: install-js install-rust ## Install all dependencies (JS + Rust)

install-js: ## Install JS dependencies (pnpm)
	$(PNPM) install

install-rust: ## Fetch Rust dependencies (cargo fetch)
	@if [ -f $(TAURI_DIR)/Cargo.toml ]; then \
		cd $(TAURI_DIR) && $(CARGO) fetch; \
	else \
		echo "Skipping cargo fetch — $(TAURI_DIR)/Cargo.toml not found yet"; \
	fi

# ---------------------------------------------------------------------------
# Dev / Build
# ---------------------------------------------------------------------------

dev: ## Run Tauri dev (Rust + Vite + webview)
	$(PNPM) tauri dev

build: ## Production desktop build (signed installers)
	$(PNPM) tauri build

build-ui: ## UI-only production build (Vite)
	$(PNPM) build

# ---------------------------------------------------------------------------
# Quality
# ---------------------------------------------------------------------------

typecheck: typecheck-js typecheck-rust ## Type-check both stacks

typecheck-js: ## TypeScript project build (no emit)
	$(PNPM) exec tsc -b

typecheck-rust: ## cargo check (compile without codegen)
	cd $(TAURI_DIR) && $(CARGO) check --all-targets

lint: lint-js lint-rust ## Run all linters

lint-js: ## Run ESLint
	$(PNPM) lint

lint-rust: ## Run cargo clippy
	cd $(TAURI_DIR) && $(CARGO) clippy --all-targets -- -D warnings

fmt: fmt-js fmt-rust ## Run all formatters

fmt-js: ## Run Prettier
	$(PNPM) format

fmt-rust: ## Run cargo fmt
	cd $(TAURI_DIR) && $(CARGO) fmt

fmt-check: fmt-check-js fmt-check-rust ## Verify formatting without writing

fmt-check-js: ## Prettier --check
	$(PNPM) exec prettier --check .

fmt-check-rust: ## cargo fmt --check
	cd $(TAURI_DIR) && $(CARGO) fmt --check

test: test-js test-rust ## Run all tests

test-js: ## Run UI tests
	$(PNPM) test

test-rust: ## Run Rust tests
	cd $(TAURI_DIR) && $(CARGO) test

verify: typecheck lint ## Quick pre-commit gate (typecheck + lint, no tests)

check: verify test ## Full pre-PR gate (verify + tests; run `make fmt-check` separately)

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------

clean: ## Remove build artefacts
	rm -rf dist node_modules/.vite
	cd $(TAURI_DIR) && $(CARGO) clean

reset: clean ## Full reset (clean + remove node_modules + lockfiles untouched)
	rm -rf node_modules
	@echo "Reset done. Run 'make setup' to reinstall."
