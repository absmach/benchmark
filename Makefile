SERVICE=seed
TESTS=users things
CGO_ENABLED=0
GOOS=linux
GOARCH=amd64
GOARM=7
BUILD_DIR=build
DATE_TIME=$(shell date +'%Y-%m-%d-%H-%M-%S')

clone-deps:
	rm -rf k6/dependencies && \
	git clone https://github.com/grafana/xk6-output-prometheus-remote.git k6/dependencies/xk6-output-prometheus-remote && \
	git clone https://github.com/grafana/k6-operator.git k6/dependencies/k6-operator

prometheus-up:
	cd k6/dependencies/xk6-output-prometheus-remote && \
	docker compose -f docker-compose.yml -p mainflux-k6-bechmark up -d

prometheus-down:
	cd k6/dependencies/xk6-output-prometheus-remote && \
	docker compose -f docker-compose.yml -p mainflux-k6-bechmark down -v

build-k6:
	go install go.k6.io/xk6/cmd/xk6@latest
	CGO_ENABLED=$(CGO_ENABLED) GOOS=$(GOOS) GOARCH=$(GOARCH) GOARM=$(GOARM) \
	xk6 build --with github.com/grafana/xk6-output-prometheus-remote \
	--with github.com/golioth/xk6-coap --with github.com/grafana/xk6-timers \
	--with github.com/pmalhaire/xk6-mqtt \
	--output $(BUILD_DIR)/k6

define compile_service
	CGO_ENABLED=$(CGO_ENABLED) GOOS=$(GOOS) GOARCH=$(GOARCH) GOARM=$(GOARM) \
	go build -mod=vendor -ldflags="-s -w" \
	-o ${BUILD_DIR}/mainflux-$(1) cmd/main.go
endef

build-seed:
	$(call compile_service,seed)

seed:
	./build/mainflux-seed -operation 0

seed-messaging:
	./build/mainflux-seed -operation 1

docker-build:
	docker build \
		--build-arg GOARCH=$(GOARCH) \
		--build-arg GOARM=$(GOARM) \
		--build-arg GOOS=$(GOOS) \
		--build-arg CGO_ENABLED=$(CGO_ENABLED) \
		--tag ghcr.io/rodneyosodo/mf-benchmark:latest .

docker-push:
	docker push ghcr.io/rodneyosodo/mf-benchmark:latest

define build_archive
	./build/k6 archive --include-system-env-vars --env MF_BENCH_ENVIRONMENT=$(MF_BENCH_ENVIRONMENT) \
	--env MF_BENCH_ADMIN_IDENTITY=$(MF_BENCH_ADMIN_IDENTITY) --env MF_BENCH_ADMIN_SECRET=$(MF_BENCH_ADMIN_SECRET) \
	--env MF_BENCH_USERS_URL=$(MF_BENCH_USERS_URL) --env MF_BENCH_THINGS_URL=$(MF_BENCH_THINGS_URL) \
	./k6/scripts/$(1).js --archive-out ./k6/scripts/$(1).tar
endef

build-archive: build-archive-users build-archive-things

build-archive-%:
	$(call build_archive,$*)

define run_local
	K6_PROMETHEUS_RW_SERVER_URL=${MF_K6_PROMETHEUS_RW_SERVER_URL} \
	K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM=${MF_K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM} \
	K6_OUT=${MF_K6_OUT} \
	./build/k6 run ./k6/scripts/$(1).tar --tag testid=$(1)${DATE_TIME}
endef

run-local: run-local-users run-local-things

run-local-%: build-archive-%
	$(call run_local,$*)

define run_docker
	sed -i "s|--tag testid=$(1)-.*|--tag testid=$(1)-${DATE_TIME}\"|" k6/docker-compose/$(1).yml
	docker compose -f k6/docker-compose/$(1).yml -p mainflux-k6-bechmark up -d
endef

run-docker: run-docker-users run-docker-things

run-docker-%: build-archive-%
	$(call run_docker,$*)

k6-operater-install:
	cd k6/dependencies/k6-operator && \
	make deploy && \
	kubectl create namespace k6-demo || { \
		echo "Namespace k6-demo already exists"; \
	}

define run_k6
	# kubectl create configmap $(1)-scripts --from-file=$(1).tar -n k6-demo && \
	# kubectl delete -n k6-demo -f k6/resources/$(1).yml && \
	# kubectl apply -n k6-demo -f k6/resources/$(1).yml

	kubectl delete configmap $(1)-scripts -n k6-demo || { \
		echo "No existing configmap found for $(1)"; \
	}

	kubectl create configmap $(1)-scripts --from-file=k6/scripts/$(1).tar -n k6-demo || { \
		echo "Error creating configmap for $(1)"; \
		exit 1; \
	}
	
	kubectl delete -n k6-demo -f k6/resources/$(1).yml || { \
		echo "No existing resources found for $(1)"; \
	}
	
	kubectl apply -n k6-demo -f k6/resources/$(1).yml || { \
		echo "Error applying resources for $(1)"; \
		exit 1; \
	}
	
	@echo "$(1) deployment completed successfully."
endef

run-k6: run-k6-users run-k6-things

run-k6-%: build-archive-%
	$(call run_k6,$*)

# define run_k8
# 	kubectl apply -n k6-demo -f k6/resources/$(1).yml
# endef

# run-k8: run-k8-users run-k8-things

# run-k8-%:
# 	$(call run_k8,$*)
