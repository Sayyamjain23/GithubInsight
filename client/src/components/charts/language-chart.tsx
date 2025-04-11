import { LanguageData } from "@/lib/types";

interface LanguageChartProps {
  languages: LanguageData[];
}

export default function LanguageChart({ languages }: LanguageChartProps) {
  if (!languages || languages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No language data available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="space-y-2">
        {languages.map((lang, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: lang.color }}
            ></div>
            <span className="text-sm text-gray-700 mr-2">{lang.name}</span>
            <span className="text-sm font-medium">{lang.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
