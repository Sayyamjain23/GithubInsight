import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Search } from "lucide-react";
import { analyzeRepository } from "@/lib/api";
import { Repository } from "@/lib/types";

const formSchema = z.object({
  repoUrl: z
    .string()
    .min(1, "Repository URL is required")
    .refine(
      (value) => value.includes("github.com/"),
      "Please enter a valid GitHub repository URL"
    ),
});

type FormData = z.infer<typeof formSchema>;

interface RepositoryInputProps {
  onRepositoryAnalyzed: (repository: Repository) => void;
  onError: (error: Error) => void;
}

export default function RepositoryInput({ onRepositoryAnalyzed, onError }: RepositoryInputProps) {
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      repoUrl: "",
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: (url: string) => analyzeRepository(url),
    onSuccess: (data) => {
      setError(null);
      onRepositoryAnalyzed(data);
    },
    onError: (err: Error) => {
      setError(err.message);
      onError(err);
    },
  });

  const handleSubmit = (data: FormData) => {
    analyzeMutation.mutate(data.repoUrl);
  };

  return (
    <div className="mb-8 rounded-xl border border-gray-200 shadow-md overflow-hidden bg-gradient-to-br from-white to-gray-50">
      <div className="p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Discover Repository Insights
            </h2>
            <p className="text-gray-600 mt-2">
              Enter a GitHub repository URL to unlock AI-powered code analysis and insights
            </p>
          </div>
          <div className="flex items-center space-x-1 bg-gray-100 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-medium text-gray-500">AI Analysis Ready</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col sm:flex-row gap-4">
            <FormField
              control={form.control}
              name="repoUrl"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <Input
                        {...field}
                        placeholder="https://github.com/facebook/react"
                        className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm"
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg shadow-md text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors duration-150"
              disabled={analyzeMutation.isPending}
            >
              {analyzeMutation.isPending ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Analyze Repository
                </>
              )}
            </Button>
          </form>
        </Form>

        {error && (
          <Alert variant="destructive" className="mt-4 border-red-200 text-red-800 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analyzeMutation.isPending && (
          <div className="mt-6 flex justify-center">
            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg flex items-center max-w-md">
              <svg className="animate-spin h-5 w-5 mr-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <div className="font-medium">Processing Repository</div>
                <div className="text-sm text-blue-600">This may take a moment while we analyze the code structure</div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-500">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Code Quality Analysis</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>AI-Powered File Exploration</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Readme Generation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
