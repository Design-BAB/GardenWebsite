package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	// Serve the current directory
	fs := http.FileServer(http.Dir("."))

	// Route all requests to the file server
	http.Handle("/", fs)

	fmt.Println("Serving on http://localhost:5500")
	err := http.ListenAndServe(":5500", nil)
	if err != nil {
		log.Fatal(err)
	}
}
