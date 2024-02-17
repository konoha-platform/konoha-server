local-up:
	docker-compose up -d

local-down:
	docker-compose down

bootstrap:
	cp .env .env.example
	cp .env.development .env.example
	docker-compose up -d
	yarn install

pre-deploy:
	docker image prune -f
	docker image build -t konoha-dev .
	docker image tag konoha-dev:latest 476234812167.dkr.ecr.ap-southeast-1.amazonaws.com/konoha-dev:latest
	docker push 476234812167.dkr.ecr.ap-southeast-1.amazonaws.com/konoha-dev:latest
	ssh konoha.api.dev "cd konoha-server && docker-compose -f docker-compose.dev.yml pull && docker-compose -f docker-compose.dev.yml up -d && docker image prune -f"

dev-down:
	docker-compose -f docker-compose.dev.yml down

dev-ps:
	docker-compose -f docker-compose.dev.yml ps

dev-logs:
	docker-compose -f docker-compose.dev.yml logs -f konoha

ssh:
	docker exec -it konoha-server_konoha_1 bash