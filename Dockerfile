FROM golang:1.21.0-alpine as builder

ARG GOARCH
ARG GOARM
ARG GOOS
ARG CGO_ENABLED

WORKDIR $GOPATH/src/github.com/mainflux/benchmark
ADD Makefile .
RUN apk update && apk add git make
RUN make install-xk6 build-k6
RUN mv build/k6 /tmp/k6

FROM alpine:3.18.3

RUN apk add --no-cache ca-certificates && \
    adduser -D -u 12345 -g 12345 k6
COPY --from=builder /tmp/k6 /usr/bin/k6

USER 12345
WORKDIR /home/k6

ENTRYPOINT ["k6"]