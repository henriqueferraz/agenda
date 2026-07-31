.PHONY: help install install-dev up down migrate run test lint format typecheck ci audit

help:
	@echo "Targets: install install-dev up down migrate run test lint format typecheck ci audit"

install:
	python -m pip install -r requirements/base.txt

install-dev:
	python -m pip install -r requirements/dev.txt

up:
	docker compose up -d db

down:
	docker compose down

migrate:
	python manage.py migrate

run:
	python manage.py runserver

test:
	pytest

lint:
	ruff check apps config tests factories
	ruff format --check apps config tests factories

format:
	ruff check --fix apps config tests factories
	ruff format apps config tests factories

typecheck:
	mypy apps config

audit:
	pip-audit -r requirements/base.txt

ci: lint typecheck test
	python manage.py makemigrations --check --dry-run
