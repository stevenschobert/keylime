default: install build start

install:
	@npm install

clean:
	@echo 'clean task not implemented'

build:
	@echo 'build task not implemented'

start:
	@npm start

test:
	@npm test

.PHONY: install clean build start test
