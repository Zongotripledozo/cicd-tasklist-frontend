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

		if _, err := os.Stat(contentRoot + r.URL.Path); err == nil {
			fileServer.ServeHTTP(w, r)
			return
		}

		if strings.Contains(requestedPath, ".") {
			http.NotFound(w, r)
			return
		}

		http.ServeFile(w, r, contentRoot+"/index.html")
	})

	server := &http.Server{
		Addr:    ":8080",
		Handler: handler,
	}

	log.Fatal(server.ListenAndServe())
}