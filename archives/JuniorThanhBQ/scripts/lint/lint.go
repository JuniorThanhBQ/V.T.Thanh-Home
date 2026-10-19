package lint

import (
	"fmt"

	"juniorthanhbq/scripts/utils"
)

func Run() error {
	fmt.Println("Linting backend...")
	if err := utils.RunCmd("npm", "run", "lint", "--prefix", "server"); err != nil {
		fmt.Println("Backend linting issues found")
	}
	fmt.Println("Linting frontend...")
	if err := utils.RunCmd("npm", "run", "lint", "--prefix", "web"); err != nil {
		fmt.Println("Frontend linting issues found")
	}
	return nil
}
