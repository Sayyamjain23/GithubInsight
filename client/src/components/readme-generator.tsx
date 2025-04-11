import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Repository, ReadmeOptions } from "@/lib/types";
import { generateReadme, downloadReadme } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ReadmeGeneratorProps {
  repository: Repository;
}

export default function ReadmeGenerator({ repository }: ReadmeGeneratorProps) {
  const { toast } = useToast();
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ReadmeOptions>({
    includeInstallation: true,
    includeUsage: true,
    includeContributing: true,
    includeLicense: true,
  });

  const readmeMutation = useMutation({
    mutationFn: () => generateReadme(repository.id, options),
    onSuccess: (data) => {
      downloadReadme(data.content, data.filename);
      toast({
        title: "README Generated",
        description: "README.md has been generated and downloaded successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Generating README",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateReadme = () => {
    readmeMutation.mutate();
  };

  const toggleOption = (option: keyof ReadmeOptions) => {
    setOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">README Generator</h2>
          <Button
            onClick={handleGenerateReadme}
            disabled={readmeMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-secondary hover:bg-green-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Generate README
          </Button>
        </div>
      </div>
      
      <div className="px-6 py-5">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Generate a comprehensive README.md file for your repository based on the analysis. The generated README will include project description, installation instructions, usage examples, and more.</p>
          
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="text-base font-medium text-gray-900 mb-2">README Preview</h3>
            <div className="prose max-w-none">
              <h1>{repository.fullName.split('/')[1]}</h1>
              <p>{repository.description}</p>
              <p>
                <img src={`https://img.shields.io/github/stars/${repository.fullName}?style=social`} alt="GitHub stars" />
                <img src={`https://img.shields.io/github/license/${repository.fullName}`} alt="License" className="ml-2" />
                <img src={`https://img.shields.io/github/last-commit/${repository.fullName}`} alt="Last commit" className="ml-2" />
              </p>
              
              {options.includeInstallation && (
                <>
                  <h2>Installation</h2>
                  <pre className="bg-gray-800 text-gray-200 p-3 rounded-md overflow-auto">
                    <code>npm install {repository.fullName.split('/')[1].toLowerCase()}</code>
                  </pre>
                </>
              )}
              
              {options.includeUsage && (
                <>
                  <h2>Usage</h2>
                  <pre className="bg-gray-800 text-gray-200 p-3 rounded-md overflow-auto">
                    <code>{`import { Example } from '${repository.fullName.split('/')[1].toLowerCase()}';

// Initialize the component
const example = new Example();
example.start();`}</code>
                  </pre>
                </>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span>You can customize the README content</span>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowOptions(!showOptions)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Customize Options
            </Button>
          </div>

          {showOptions && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">README Sections</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="installation" 
                    checked={options.includeInstallation}
                    onCheckedChange={() => toggleOption('includeInstallation')}
                  />
                  <label 
                    htmlFor="installation" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include Installation Instructions
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="usage" 
                    checked={options.includeUsage}
                    onCheckedChange={() => toggleOption('includeUsage')}
                  />
                  <label 
                    htmlFor="usage" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include Usage Examples
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="contributing" 
                    checked={options.includeContributing}
                    onCheckedChange={() => toggleOption('includeContributing')}
                  />
                  <label 
                    htmlFor="contributing" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include Contributing Guidelines
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="license" 
                    checked={options.includeLicense}
                    onCheckedChange={() => toggleOption('includeLicense')}
                  />
                  <label 
                    htmlFor="license" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include License Information
                  </label>
                </div>
              </div>
            </div>
          )}

          {readmeMutation.isPending && (
            <div className="flex items-center justify-center p-4">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-700">Generating README...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
