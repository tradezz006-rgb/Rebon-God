import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ImmersiveMeeting from "@/components/workspace/ImmersiveMeeting";
import FeedbackModal from "@/components/workspace/FeedbackModal";
import ProgressTracker from "@/components/workspace/ProgressTracker";
import AssessmentQuiz from "@/components/workspace/AssessmentQuiz";
import DailyChallenges from "@/components/workspace/DailyChallenges";
import RecommendedScenarios from "@/components/workspace/RecommendedScenarios";
import { scenarios, assessments, Scenario, Assessment } from "@/data/workspaceScenarios";
import {
  Briefcase,
  ClipboardList,
  Filter,
  Search,
  ChevronDown,
  MessageSquare,
  GraduationCap,
  Building2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const professionalCategories = [
  "Leadership",
  "Client Management",
  "Executive Presence",
  "Team Management",
  "Conflict Resolution",
];

const professionalScenarioMap: Record<string, string> = {
  "HR Interview": "Leadership",
  "Manager Communication": "Team Management",
  "Team Collaboration": "Executive Presence",
  "Client Relations": "Client Management",
  Presentations: "Executive Presence",
  "Cross-functional": "Conflict Resolution",
};

/** Communication-domain Work only — never shown under Cloud/Engineering. */
export default function CommunicationWorkspace() {
  const { user } = useAuth();
  const [pathType, setPathType] = useState<"student" | "professional">("student");
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [showImmersive, setShowImmersive] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  useEffect(() => {
    const loadPath = async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("path_type").eq("user_id", user.id).single();
      if (data?.path_type) setPathType(data.path_type as "student" | "professional");
    };
    loadPath();
  }, [user]);

  const handlePathChange = async (path: "student" | "professional") => {
    setPathType(path);
    if (user) {
      await supabase.from("profiles").update({ path_type: path } as any).eq("user_id", user.id);
    }
  };

  const getDisplayCategory = (category: string) =>
    pathType === "professional" ? professionalScenarioMap[category] || category : category;

  const commCategories =
    pathType === "professional"
      ? ["All", ...professionalCategories]
      : ["All", ...new Set(scenarios.filter((s) => s.type !== "cloud_workspace").map((s) => s.category))];

  const difficulties = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];

  const filteredScenarios = scenarios.filter((scenario) => {
    if (scenario.type === "cloud_workspace") return false;
    const matchesSearch =
      scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scenario.context.toLowerCase().includes(searchQuery.toLowerCase());
    const displayCat = getDisplayCategory(scenario.category);
    const matchesCategory = selectedCategory === "All" || displayCat === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "All" || scenario.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      assessment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assessment.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = selectedDifficulty === "All" || assessment.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-success/20 text-success";
      case "Intermediate":
        return "bg-info/20 text-info";
      case "Advanced":
        return "bg-coral/20 text-coral";
      case "Expert":
        return "bg-primary/20 text-primary";
      default:
        return "bg-primary/20 text-primary";
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-6">
        <div className="inline-flex items-center rounded-xl glass border border-border/50 p-1">
          <button
            onClick={() => handlePathChange("student")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathType === "student" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student
          </button>
          <button
            onClick={() => handlePathChange("professional")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              pathType === "professional" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Professional
          </button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">
            {pathType === "professional" ? "Corporate Communication" : "Communication Practice"}
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
          {pathType === "professional" ? "Corporate " : "Communication "}
          <span className="text-gradient">Scenarios</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {pathType === "professional"
            ? "Master leadership, client management, and executive communication skills."
            : "Practice real-world corporate communication with immersive meeting simulations."}
        </p>
      </motion.div>

      <DailyChallenges domain="communication" />

      <RecommendedScenarios
        domain="communication"
        onScenarioClick={(id) => {
          const s = scenarios.find((sc) => sc.id === id && sc.type !== "cloud_workspace");
          if (s) {
            setSelectedScenario(s);
            setShowImmersive(true);
          }
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search scenarios or assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                {selectedCategory}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {commCategories.map((category) => (
                <DropdownMenuItem key={category} onClick={() => setSelectedCategory(category)}>
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {selectedDifficulty}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {difficulties.map((difficulty) => (
                <DropdownMenuItem key={difficulty} onClick={() => setSelectedDifficulty(difficulty)}>
                  {difficulty}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      <ProgressTracker />

      <Tabs defaultValue="scenarios" className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="scenarios" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Scenarios ({filteredScenarios.length})
          </TabsTrigger>
          <TabsTrigger value="assessments" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            Assessments ({filteredAssessments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scenarios">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredScenarios.map((scenario, index) => (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div
                  onClick={() => {
                    setSelectedScenario(scenario);
                    setShowImmersive(true);
                  }}
                  className="glass rounded-xl p-5 cursor-pointer hover:bg-secondary/50 transition-all duration-300 group h-full"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <scenario.icon className="w-6 h-6 text-primary" />
                    </div>
                    <Badge className={getDifficultyColor(scenario.difficulty)}>{scenario.difficulty}</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {scenario.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{scenario.context}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="bg-secondary/50 px-2 py-1 rounded">{getDisplayCategory(scenario.category)}</span>
                    <span>{scenario.duration}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assessments">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssessments.map((assessment, index) => (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => {
                  setSelectedAssessment(assessment);
                  setShowAssessment(true);
                }}
                className="glass rounded-xl p-5 cursor-pointer hover:bg-secondary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <Badge className={getDifficultyColor(assessment.difficulty)}>{assessment.difficulty}</Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{assessment.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{assessment.description}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{assessment.questionCount} questions</span>
                  <span>•</span>
                  <span>{assessment.duration}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {showImmersive && selectedScenario && (
        <ImmersiveMeeting
          scenario={selectedScenario}
          onClose={() => {
            setShowImmersive(false);
            setSelectedScenario(null);
          }}
          onComplete={(feedbackData) => {
            setShowImmersive(false);
            setFeedback(feedbackData);
          }}
        />
      )}

      {feedback && selectedScenario && (
        <FeedbackModal
          feedback={feedback}
          scenarioName={selectedScenario.name}
          onClose={() => {
            setFeedback(null);
            setSelectedScenario(null);
          }}
        />
      )}

      {showAssessment && selectedAssessment && (
        <AssessmentQuiz
          assessment={selectedAssessment}
          onClose={() => {
            setShowAssessment(false);
            setSelectedAssessment(null);
          }}
          onComplete={() => {
            setShowAssessment(false);
            setSelectedAssessment(null);
          }}
        />
      )}
    </>
  );
}
