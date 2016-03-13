BIN = ./node_modules/.bin

.PHONY: bootstrap test test-watch lint release-patch release-minor release-major;

TESTS = $(shell find ./src -type f -name '*-test.js')

test: lint
	@NODE_ENV=test $(BIN)/mocha $(TESTS)

test-watch:
	@NODE_ENV=test $(BIN)/mocha $(TESTS) --watch

lint:
	@$(BIN)/standard

bootstrap: package.json
	@npm install

build:
	@rm -rf dist && mkdir dist
	@NODE_ENV=production $(BIN)/babel ./src --out-dir ./dist

release-patch:
	@inc=patch ./scripts/release.sh

release-minor:
	@inc=minor ./scripts/release.sh

release-major:
	@inc=major ./scripts/release.sh
