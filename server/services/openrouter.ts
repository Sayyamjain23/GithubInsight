import axios from "axios";
import dotenv from 'dotenv'
dotenv.config()
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function analyzeCode(
  directoryStructure: string,
  codeContent: string,
  filePath: string
): Promise<string> {
  // Get OpenRouter API key from environment variables
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OpenRouter API key is not configured");
  }

  // Create prompt for code analysis
  const systemPrompt = `You are a senior software developer specializing in code analysis and explanation. 
Your task is to analyze the provided code file within the context of the repository structure.

Your analysis MUST be formatted with clear, visually structured markdown:
- Use "##" for main section headers (like "## SUMMARY")
- Use "###" for sub-section headers
- Use bullet points ("- " prefix) for listing features or points
- Use numbered lists (1., 2., etc.) for steps or prioritized items
- Use **bold** for important concepts, class names, or method names
- Use code formatting \`like this\` for inline code references

Your analysis MUST include these clearly formatted sections:

## SUMMARY
A concise overview of the file's purpose and significance (3-5 sentences)

## PURPOSE & FUNCTIONALITY
Detailed explanation of what this code does

## KEY COMPONENTS
Important classes, functions, or modules with descriptions

## DEPENDENCIES & IMPORTS
External libraries and internal file dependencies

## CODE INTERACTIONS
How this code connects to other parts of the system

## RECOMMENDATIONS
Potential optimizations or improvements

Format your response professionally with consistent heading hierarchy, clean bullet points, and proper spacing between sections for easy scanning.`;

  const userPrompt = `I need you to analyze the following code file:

Repository structure:
\`\`\`
${directoryStructure}
\`\`\`

${codeContent}

Please provide a detailed analysis of ${filePath} using the required formatting structure.`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  try {
    // Make request to OpenRouter API
    const response = await axios.post<OpenRouterResponse>(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "anthropic/claude-3-haiku",
        messages
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://github.com/analyzer",
          "X-Title": "GitHub Repository Analyzer"
        }
      }
    );

    // Return the generated analysis
    if (response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error("No response from OpenRouter API");
    }
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`OpenRouter API error: ${error.response.data.error || error.message}`);
    }
    throw new Error("Failed to analyze code with OpenRouter");
  }
}