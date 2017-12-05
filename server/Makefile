prog = strut
SRC = src/strut

GOPATH = $(realpath .)
GOOS := linux
GOARCH := arm
GOARM := 6

all: $(prog)

$(SRC)/vendor: $(SRC)/Gopkg.lock
	cd $(SRC) && env GOPATH=$(GOPATH) dep ensure

$(prog): $(SRC)/vendor $(SRC)/*.go
	cd $(SRC) && env GOPATH=$(GOPATH) GOOS=$(GOOS) GOARCH=$(GOARCH) GOARM=$(GOARM) go build -v -o $(GOPATH)/$(prog) ./...

clean:
	rm -f $(prog)

clean-all: clean
	rm -rf pkg $(SRC)/vendor

.PHONY: all clean clean-all
