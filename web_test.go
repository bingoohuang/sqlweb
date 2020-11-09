package sqlweb_test

import (
	"github.com/bingoohuang/sqlweb"
	"github.com/bingoohuang/toml"
	"github.com/magiconair/properties/assert"
	"log"
	"testing"
)

func TestDecodeFileConfig(t *testing.T) {
	var conf sqlweb.AppConfig
	if _, err := toml.DecodeFile("testdata/sqlweb.toml", &conf); err != nil {
		log.Panic("config file decode error", err.Error())
	}

	assert.Equal(t, []string{"admin:admin"}, conf.BasicAuth)
}
