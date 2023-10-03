# Development Guide

Load testing is a type of non-functional testing. It is a process of putting demand on a system or device and measuring its response. Load testing is performed to determine a system's behavior under both normal and anticipated peak load conditions. It helps to identify the maximum operating capacity of an application as well as any bottlenecks and determine which element is causing degradation. With load testing we are able to measure:

- latency
- reliability
- availability
- resilience
- scalability
- throughput

## Pre-requisites

These benchmarks tests are build by [k6](https://k6.io/). K6 is an open-source modern load testing tool that makes performance testing easy and productive. It provides a clean, approachable scripting API, local and cloud execution, flexible configuration, with command & control through CLI or a REST API. k6 will help you to build resilient and performant applications that scale.

## Why distributed load testing?

[k6-operator](https://github.com/grafana/k6-operator) is a Kubernetes operator that allows you to run k6 tests in Kubernetes. It is designed to be used in conjunction with the k6. With distributed load testing:

- mainflux system under test (SUT) can be tested with a large number of virtual users (VUs) and requests per second (RPS) from multiple ip addresses that would not be possible with a single machine.
- kubernetes, which has proven to be a reliable and scalable container orchestration system, can be used to run k6 tests.
- a fully optimised node can't produce the same amount of traffic as a distributed load test.

## Why k6 ?

## Development Testing

### Install dependencies

Install prometheus remote output plugin for k6. This plugin allows you to send k6 metrics to a Prometheus Pushgateway or directly to a Prometheus server.

Install k6-operator in your kubernetes cluster. This operator will be used to run k6 tests in kubernetes.

```bash
make clone-deps
```

Install xk6. xk6 is a tool for building k6 with different sets of extensions. It is used to build k6 with prometheus remote output plugin.

```bash
make install-xk6
```

Build k6 with prometheus remote output plugin.

```bash
make build-k6
```

#### Build Docker image

Docker image is used to run k6 tests in kubernetes. It is built from the Dockerfile in the k6 directory.

```bash
make docker-build
```

### Run tests

1. Start prometheus with grafana. This will be used to visualise k6 metrics.

   ```bash
   make start-prometheus
   ```

2. Build a seeding go application. This application will be used to seed the database with data.

   ```bash
   make build-seed
   ```

3. Seed the database with data.

   ```bash
   make seed
   ```

   when testing `CoAP`, `HTPP`, `MQTT` and `WebSocket` protocol adapters use the following command to seed the database with data.

   ```bash
   make seed-messaging
   ```

4. Run tests locally.

   ```bash
   make run-local
   ```

5. Run tests in docker.

   ```bash
   make run-docker
   ```

6. Run tests in kubernetes. Ensure you have a kubernetes cluster running. If you don't have a kubernetes cluster running, you can use [k3d](https://k3d.io/) to create a kubernetes cluster.

   Create a kubernetes cluster with k3d.

   ```bash
   k3d cluster create k6-mainflux-cluster \
   --port "8081:80@loadbalancer" \
   --agents 3 \
   --k3s-arg '--kube-apiserver-arg=feature-gates=EphemeralContainers=true@server:*'
   ```

   ```bash
   make run-k8s
   ```

The tests results will be displayed in the terminal. The results will also be sent to prometheus. To view the results in prometheus, open `http://localhost:9090` in your browser. To view the results in grafana, open `http://localhost:3000` in your browser.

The terminal output will look like this. Note this is truncated output.

```bash
...

     checks.........................: 100.00% ✓ 9958       ✗ 0
     data_received..................: 9.1 MB  224 kB/s
     data_sent......................: 3.9 MB  95 kB/s
     group_duration.................: avg=328.79ms min=47.52ms  med=263.75ms max=3.12s    p(90)=560.35ms p(95)=675.82ms
     http_req_blocked...............: avg=12.3µs   min=601ns    med=2.25µs   max=52.83ms  p(90)=4.02µs   p(95)=6.03µs
     http_req_connecting............: avg=8.86µs   min=0s       med=0s       max=52.78ms  p(90)=0s       p(95)=0s
     http_req_duration..............: avg=143.49ms min=494.47µs med=126.23ms max=859.02ms p(90)=271.53ms p(95)=325.22ms
       { expected_response:true }...: avg=143.49ms min=494.47µs med=126.23ms max=859.02ms p(90)=271.53ms p(95)=325.22ms
     http_req_failed................: 0.00%   ✓ 0          ✗ 9958
     http_req_receiving.............: avg=53.18µs  min=10.41µs  med=37.29µs  max=19.95ms  p(90)=72.01µs  p(95)=89.89µs
     http_req_sending...............: avg=18.45µs  min=5.58µs   med=13.21µs  max=13.61ms  p(90)=22.86µs  p(95)=27.72µs
     http_req_tls_handshaking.......: avg=0s       min=0s       med=0s       max=0s       p(90)=0s       p(95)=0s
     http_req_waiting...............: avg=143.41ms min=463.85µs med=126.2ms  max=858.99ms p(90)=271.35ms p(95)=325.17ms
     http_reqs......................: 9958    245.905097/s
     iteration_duration.............: avg=1.04s    min=97.3ms   med=666.55ms max=4.28s    p(90)=2.05s    p(95)=3.03s
     iterations.....................: 1371    33.855783/s
     vus............................: 26      min=0        max=100
     vus_max........................: 205     min=205      max=205


running (0m40.5s), 000/205 VUs, 1371 complete and 0 interrupted iterations
create            ✓ [======================================] 1 VUs      1s
get_after         ✓ [======================================] 1 VUs      1s
get_before        ✓ [======================================] 1 VUs      1s
others            ✓ [======================================] 1 VUs      1s
update            ✓ [======================================] 1 VUs      1s
create_load       ✓ [======================================] 00/10 VUs  4s
get_after_load    ✓ [======================================] 00/10 VUs  4s
get_before_load   ✓ [======================================] 00/10 VUs  4s
others_load       ✓ [======================================] 00/10 VUs  4s
update_load       ✓ [======================================] 00/10 VUs  4s
create_stress     ✓ [======================================] 00/20 VUs  8s
get_after_stress  ✓ [======================================] 00/20 VUs  8s
get_before_stress ✓ [======================================] 00/20 VUs  8s
others_stress     ✓ [======================================] 00/20 VUs  8s
update_stress     ✓ [======================================] 00/20 VUs  8s
create_soak       ✓ [======================================] 00/10 VUs  12s
get_after_soak    ✓ [======================================] 00/10 VUs  12s
get_before_soak   ✓ [======================================] 00/10 VUs  12s
others_soak       ✓ [======================================] 00/10 VUs  12s
update_soak       ✓ [======================================] 00/10 VUs  12s
...
```

## Production Testing
