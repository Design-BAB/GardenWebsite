@ECHO on
$env:GOOS="js"; $env:GOARCH="wasm"; go build -o .\Raylib-Go-Wasm\index\main.wasm .
Remove-Item Env:GOOS
Remove-Item Env:GOARCH
go build -o server.exe .\Raylib-Go-Wasm\server\server.go
./server.exe
