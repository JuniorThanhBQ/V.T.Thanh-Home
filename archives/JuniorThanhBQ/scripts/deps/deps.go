package deps

import (
	"fmt"

	"juniorthanhbq/scripts/utils"
)

func Run() error {
	fmt.Println("Installing backend dependencies...")
	if err := utils.RunCmd("npm", "install", "--prefix", "server"); err != nil {
		return err
	}
	fmt.Println("Installing frontend dependencies...")
	if err := utils.RunCmd("npm", "install", "--prefix", "web"); err != nil {
		return err
	}
	return nil
}

func Update() error {
	fmt.Println("Scanning backend dependencies for updates...")
	utils.RunCmdIgnoreError("npm", "outdated", "--prefix", "server")

	fmt.Println("Updating backend dependencies...")
	if err := utils.RunCmd("npm", "update", "--prefix", "server"); err != nil {
		return err
	}

	fmt.Println("Auditing and fixing backend dependencies...")
	utils.RunCmdIgnoreError("npm", "audit", "fix", "--prefix", "server")

	fmt.Println("Scanning frontend dependencies for updates...")
	utils.RunCmdIgnoreError("npm", "outdated", "--prefix", "web")

	fmt.Println("Updating frontend dependencies...")
	if err := utils.RunCmd("npm", "update", "--prefix", "web"); err != nil {
		return err
	}

	fmt.Println("Auditing and fixing frontend dependencies...")
	utils.RunCmdIgnoreError("npm", "audit", "fix", "--prefix", "web")

	fmt.Println("All dependencies updated successfully.")
	return nil
}
