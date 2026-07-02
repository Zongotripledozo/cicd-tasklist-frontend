package main

import (
	"log"
	"net/http"
	"os"
	"strings"
)

const contentRoot = "/srv"

func main() {
	fileServer := http.FileServer(http.Dir(contentRoot))

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestedPath := strings.TrimPrefix(r.URL.Path, "/")
		if requestedPath == "" {
			fileServer.ServeHTTP(w, r)
			return
		}

		if info, err := os.Stat(contentRoot + r.URL.Path); err == nil {
			if info.IsDir() {
				fileServer.ServeHTTP(w, r)
				return
			}
			fileServer.ServeHTTP(w, r)
			return
		}

		if strings.Contains(requestedPath, ".") {
			http.NotFound(w, r)
			return
		}

		r.URL.Path = "/index.html"
		fileServer.ServeHTTP(w, r)
	})

	server := &http.Server{
		Addr:    ":8080",
		Handler: handler,
	}

	log.Fatal(server.ListenAndServe())
}