default: install build start

install:
	@npm install

clean:
	@rm -rf dist/*

build:
	@npm run build

start:
	@npm start

test:
	@npm test

bench:
	@npm run bench

.PHONY: install clean build start test bench
