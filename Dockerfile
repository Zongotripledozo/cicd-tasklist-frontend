FROM node:22.17.1-alpine3.22 AS builder
WORKDIR /app

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM golang:1.26.4-alpine3.22 AS server-builder
WORKDIR /server
COPY server/main.go ./main.go
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/tasklist-server ./main.go

FROM scratch AS runtime
COPY --from=server-builder /out/tasklist-server /tasklist-server
COPY --from=builder /app/dist /srv

USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/tasklist-server"]