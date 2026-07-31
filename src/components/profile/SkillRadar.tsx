import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

type CommunicationData = {
  fluency: number;
  clarity: number;
  confidence: number;
  tone: number;
  structure: number;
  grammar: number;
};

type FullStackData = {
  frontend: number;
  backend: number;
  devops: number;
  systemDesign: number;
  codeQuality: number;
  problemSolving: number;
};

interface SkillRadarProps {
  data: CommunicationData | FullStackData;
  type?: "communication" | "fullstack";
}

const SkillRadar = ({ data, type = "communication" }: SkillRadarProps) => {
  const isCommunication = type === "communication" || "fluency" in data;
  
  const chartData = isCommunication
    ? [
        { skill: "Clarity", value: (data as CommunicationData).clarity, fullMark: 10 },
        { skill: "Fluency", value: (data as CommunicationData).fluency, fullMark: 10 },
        { skill: "Grammar", value: (data as CommunicationData).grammar, fullMark: 10 },
        { skill: "Tone", value: (data as CommunicationData).tone, fullMark: 10 },
        { skill: "Confidence", value: (data as CommunicationData).confidence, fullMark: 10 },
        { skill: "Structure", value: (data as CommunicationData).structure, fullMark: 10 },
      ]
    : [
        { skill: "Frontend", value: (data as FullStackData).frontend, fullMark: 10 },
        { skill: "Backend", value: (data as FullStackData).backend, fullMark: 10 },
        { skill: "DevOps", value: (data as FullStackData).devops, fullMark: 10 },
        { skill: "Design", value: (data as FullStackData).systemDesign, fullMark: 10 },
        { skill: "Quality", value: (data as FullStackData).codeQuality, fullMark: 10 },
        { skill: "Problem", value: (data as FullStackData).problemSolving, fullMark: 10 },
      ];

  const hasData = chartData.some(d => d.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center w-full h-full"
    >
      {/* Title */}
      <div className="text-center pt-6 pb-2">
        <h3 className="text-lg font-bold tracking-widest text-foreground uppercase">
          {isCommunication ? "Skill Radar" : "Tech Radar"}
        </h3>
        {!hasData && (
          <p className="text-xs text-muted-foreground mt-1">Complete scenarios to see your skills</p>
        )}
      </div>

      {/* Radar Chart - takes all available space */}
      <div className="flex-1 w-full min-h-0" style={{ minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid 
              stroke="hsl(var(--border))" 
              strokeOpacity={0.4}
              gridType="polygon"
            />
            <PolarAngleAxis 
              dataKey="skill" 
              tick={{ 
                fill: "hsl(var(--muted-foreground))", 
                fontSize: 11, 
                fontWeight: 600,
              }}
              tickLine={false}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 10]} 
              tickCount={6}
              tick={{ 
                fill: "hsl(var(--muted-foreground))", 
                fontSize: 9,
              }}
              axisLine={false}
            />
            <Radar
              name="Skills"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.25}
              strokeWidth={2.5}
              dot={{
                r: 5,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score summary row */}
      <div className="flex flex-wrap justify-center gap-3 px-4 pb-4">
        {chartData.map((item) => (
          <div key={item.skill} className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-muted-foreground">{item.skill}</span>
            <span className="font-bold text-foreground">{item.value.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SkillRadar;
