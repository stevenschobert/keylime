default: install build start

install:
	@npm install

clean:
	@echo 'clean task not implemented'

build:
	@npm run build

start:
	@npm start

test:
	@npm test

.PHONY: install clean build start test
