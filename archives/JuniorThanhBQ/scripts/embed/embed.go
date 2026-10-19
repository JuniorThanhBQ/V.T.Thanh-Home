package embed

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type RAGChunk struct {
	Header    string    `json:"header"`
	Content   string    `json:"content"`
	Embedding []float32 `json:"embedding"`
}

func Run() error {
	fmt.Println("Starting RAG Embedding Pipeline...")

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		envBytes, err := os.ReadFile(".env")
		if err == nil {
			lines := strings.Split(string(envBytes), "\n")
			for _, line := range lines {
				parts := strings.SplitN(line, "=", 2)
				if len(parts) == 2 && strings.TrimSpace(parts[0]) == "GEMINI_API_KEY" {
					apiKey = strings.TrimSpace(parts[1])
					apiKey = strings.Trim(apiKey, `"'`+"\r\n\t ")
					break
				}
			}
		}
	}
	if apiKey == "" {
		return fmt.Errorf("GEMINI_API_KEY environment variable is not set")
	}

	filesToProcess := []string{
		"server/src/rag/vtt_information.md",
		"server/src/rag/vtt_information_vi.md",
	}

	var chunks []RAGChunk

	for _, filePath := range filesToProcess {
		mdBytes, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read %s: %v", filePath, err)
		}
		mdContent := string(mdBytes)

		lines := strings.Split(mdContent, "\n")
		var currentHeader string
		var currentContent strings.Builder

		for _, line := range lines {
			trimmed := strings.TrimSpace(line)
			if strings.HasPrefix(trimmed, "#") {
				contentStr := strings.TrimSpace(currentContent.String())
				if currentHeader != "" && contentStr != "" {
					chunks = append(chunks, RAGChunk{
						Header:  currentHeader,
						Content: contentStr,
					})
				}
				currentHeader = trimmed
				currentContent.Reset()
			} else {
				currentContent.WriteString(line + "\n")
			}
		}
		contentStr := strings.TrimSpace(currentContent.String())
		if currentHeader != "" && contentStr != "" {
			chunks = append(chunks, RAGChunk{
				Header:  currentHeader,
				Content: contentStr,
			})
		}
	}

	if len(chunks) == 0 {
		return fmt.Errorf("no chunks found in markdown files")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return fmt.Errorf("failed to create GenAI client: %v", err)
	}
	defer client.Close()

	model := client.EmbeddingModel("gemini-embedding-001")

	fmt.Printf("Generating embeddings for %d chunks using gemini-embedding-001...\n", len(chunks))

	for i := range chunks {
		chunkText := chunks[i].Header + "\n\n" + chunks[i].Content
		res, err := model.EmbedContent(ctx, genai.Text(chunkText))
		if err != nil {
			return fmt.Errorf("failed to embed chunk %d: %v", i, err)
		}
		if res.Embedding == nil || len(res.Embedding.Values) == 0 {
			return fmt.Errorf("received empty embedding for chunk %d", i)
		}
		chunks[i].Embedding = res.Embedding.Values
		fmt.Printf("Embedded chunk %d/%d: %s\n", i+1, len(chunks), chunks[i].Header)
	}

	jsonBytes, err := json.MarshalIndent(chunks, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal chunks: %v", err)
	}

	err = os.WriteFile("server/src/rag/vtt_embeddings.json", jsonBytes, 0644)
	if err != nil {
		return fmt.Errorf("failed to write vtt_embeddings.json: %v", err)
	}

	fmt.Println("RAG Embedding Pipeline completed successfully. Output saved to server/src/rag/vtt_embeddings.json")
	return nil
}
