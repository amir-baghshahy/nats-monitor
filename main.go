//go:build !wails_ignore

package main

import (
	"io/fs"
	"os"
	"path/filepath"

	"github.com/amir-baghshahy/nats-horizon/desktop"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

func main() {
	app := desktop.NewApp()

	frontendDist := resolveFrontendDist()

	err := wails.Run(&options.App{
		Title:     "nats-horizon",
		Width:     1280,
		Height:    800,
		MinWidth:  900,
		MinHeight: 600,
		AssetServer: &assetserver.Options{
			Assets: frontendDist,
		},
		OnStartup:  app.StartUp,
		OnShutdown: app.ShutDown,
		Bind: []interface{}{
			app,
		},
	})
	if err != nil {
		println("Error:", err.Error())
	}
}

func resolveFrontendDist() fs.FS {
	candidates := []string{
		"web/dist",
		"../web/dist",
		"../../web/dist",
	}

	exe, _ := os.Executable()
	if exe != "" {
		exeDir := filepath.Dir(exe)
		candidates = append(candidates,
			filepath.Join(exeDir, "web/dist"),
			filepath.Join(exeDir, "../web/dist"),
		)
	}

	for _, path := range candidates {
		if info, err := os.Stat(path); err == nil && info.IsDir() {
			sub, err := fs.Sub(os.DirFS(path), ".")
			if err == nil {
				return sub
			}
		}
	}

	return os.DirFS("web/dist")
}
