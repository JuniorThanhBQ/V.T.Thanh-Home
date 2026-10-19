package runner

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"sync"
)

func Run() error {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func() {
		<-c
		fmt.Println("\nReceived interrupt, stopping all services...")
		cancel()
	}()

	var wg sync.WaitGroup
	wg.Add(2)

	errCh := make(chan error, 2)

	go func() {
		defer wg.Done()
		fmt.Println("Starting backend...")
		cmd := exec.CommandContext(ctx, "npm", "run", "start:dev", "--prefix", "server")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			errCh <- fmt.Errorf("backend exited: %v", err)
			cancel()
		}
	}()

	go func() {
		defer wg.Done()
		fmt.Println("Starting frontend...")
		cmd := exec.CommandContext(ctx, "npm", "run", "dev", "--prefix", "web")
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		if err := cmd.Run(); err != nil {
			errCh <- fmt.Errorf("frontend exited: %v", err)
			cancel()
		}
	}()

	wg.Wait()
	close(errCh)

	for err := range errCh {
		if err != nil && err.Error() != "signal: killed" {
			fmt.Println("Error:", err)
		}
	}
	return nil
}
