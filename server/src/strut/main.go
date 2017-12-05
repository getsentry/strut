package main

import (
	"context"
	"crypto/md5"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"

	"cloud.google.com/go/pubsub"
	"github.com/mattrobenolt/size"
)

const GOOGLE_STORAGE_BASE = "https://storage.googleapis.com/"

var (
	cache        = flag.String("cache", "", "path to cache song downloads")
	project      = flag.String("project", "", "Google project id")
	subscription = flag.String("subscription", "", "pubsub subscription name")
	maxLatency   = flag.Duration("max-latency", 10*time.Second, "max latency in seconds before message is discarded")
	bucket       = flag.String("bucket", "", "Google Storage bucket name")
	player       = flag.String("player", "/usr/bin/omxplayer", "Path to mp3 player")
)

type Event struct {
	User struct {
		Email string
		Song  struct {
			Options struct {
				VideoId  string `json:"video_id"`
				Start    int
				Duration int
			}
		}
	}
}

func (e Event) Hash() string {
	o := e.User.Song.Options
	h := md5.New()
	io.WriteString(h, o.VideoId)
	io.WriteString(h, ":")
	io.WriteString(h, strconv.Itoa(o.Start))
	io.WriteString(h, ":")
	io.WriteString(h, strconv.Itoa(o.Duration))
	return fmt.Sprintf("%x", h.Sum(nil))
}

func fetch(id, path string) (string, error) {
	cachePath := filepath.Join(*cache, path)
	_, err := os.Stat(cachePath)
	if err == nil {
		return cachePath, nil
	}
	if !os.IsNotExist(err) {
		return "", err
	}
	tmpfile, err := ioutil.TempFile(*cache, "")
	if err != nil {
		return "", err
	}
	defer os.Remove(tmpfile.Name())

	url := GOOGLE_STORAGE_BASE + *bucket + "/" + path

	log.Printf("%s: downloading %s -> %s", id, url, tmpfile.Name())

	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", errors.New(fmt.Sprintf("http: %d", resp.StatusCode))
	}

	_, err = io.Copy(tmpfile, resp.Body)
	if err != nil {
		return "", nil
	}

	log.Printf("%s: renaming %s -> %s", id, tmpfile.Name(), cachePath)
	if err = os.Rename(tmpfile.Name(), cachePath); err != nil {
		return "", nil
	}

	return cachePath, nil
}

func init() { flag.Parse() }

func main() {
	ctx := context.Background()
	client, err := pubsub.NewClient(ctx, *project)
	if err != nil {
		panic(err)
	}
	sub := client.Subscription(*subscription)
	err = sub.Receive(ctx, func(ctx context.Context, m *pubsub.Message) {
		m.Ack()
		latency := time.Now().Sub(m.PublishTime)
		log.Printf("%s: hello, length=%s, %s latency",
			m.ID, size.Capacity(len(m.Data)), latency)
		if latency > *maxLatency {
			log.Printf("%s: ignoring too old", m.ID)
			return
		}
		var e Event
		err := json.Unmarshal(m.Data, &e)
		if err != nil {
			log.Printf("%s: %s", m.ID, err)
			return
		}
		log.Printf("%s: user=%s, song=%s", m.ID, e.User.Email, e.User.Song.Options.VideoId)
		mp3 := e.Hash() + ".mp3"
		go func() {
			cachePath, err := fetch(m.ID, mp3)
			if err != nil {
				log.Printf("%s: %s", m.ID, err)
				return
			}
			if err := exec.Command(*player, cachePath).Run(); err != nil {
				log.Printf("%s: %s", m.ID, err)
			}
		}()
	})
	if err != context.Canceled {
		panic(err)
	}
}
