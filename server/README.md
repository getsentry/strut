# STRUT server

The STRUT server is designed to be run on a Raspberry Pi and is written in Go.

## Dependencies for building

* Go (tested with 1.9.2)
* dep (tested 0.3.2)

### Installing Dependencies on macOS

```bash
$ brew install go dep
```

## Building

To compile a production build read to be shipped to the Raspberry Pi, just simply:

```bash
$ make
```

When working on macOS, it's desirable to not have an ARM build, so you can build with:

```bash
$ make GOOS=darwin GOARCH=amd64
```
