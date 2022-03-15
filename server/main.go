package main

import (
	"embed"
	"flag"
	"net/http"
	"strconv"

	"github.com/iris-contrib/middleware/secure"
	"github.com/vesoft-inc/nebula-studio/server/pkg/config"
	"github.com/vesoft-inc/nebula-studio/server/pkg/logging"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver"
	"github.com/vesoft-inc/nebula-studio/server/pkg/webserver/service/importer"

	"github.com/kataras/iris/v12"
	"go.uber.org/zap"
)

//go:embed assets/*
var assets embed.FS

func main() {
	var address string
	var port int
	var studioServerConfig string

	flag.StringVar(&studioServerConfig, "studio-config", "./config/example-config.yaml", "path to the platform config file")
	flag.Parse()

	// init logger
	loggingOptions := logging.NewOptions()
	if err := loggingOptions.InitGlobals(); err != nil {
		panic(err)
	}

	if err := config.InitConfig(studioServerConfig); err != nil {
		zap.L().Fatal("init config failed", zap.Error(err))
	}

	address = config.Cfg.Web.Address
	port = config.Cfg.Web.Port

	importer.InitDB()

	s := secure.New(secure.Options{
		// FrameDeny:               true,           // If FrameDeny is set to true, adds the X-Frame-Options header with the value of `DENY`. Default is false.
		// CustomFrameOptionsValue: "ALLOW-FROM *", // CustomFrameOptionsValue allows the X-Frame-Options header value to be set with a custom value. This overrides the FrameDeny option.
	})

	app := webserver.InitApp()
	app.Use(s.Handler)
	app.HandleDir("/", http.FS(assets), iris.DirOptions{
		IndexName: "/assets/index.html",
		SPA:       true,
	})

	if err := app.Listen(address + ":" + strconv.Itoa(port)); err != nil && err != http.ErrServerClosed {
		zap.L().Fatal("Listen failed", zap.Error(err))
	}
}
