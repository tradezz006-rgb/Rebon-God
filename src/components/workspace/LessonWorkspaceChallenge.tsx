import { useNavigate } from "react-router-dom";
import FreshBiteOpsCenter from "@/components/cloud/ops/FreshBiteOpsCenter";

interface LessonWorkspaceChallengeProps {
  lessonId: string;
  onBack?: () => void;
  onClose?: () => void;
  initialTaskId?: string;
}

export function LessonWorkspaceChallenge({
  lessonId,
  onBack,
  onClose,
  initialTaskId,
}: LessonWorkspaceChallengeProps) {
  const navigate = useNavigate();

  return (
    <FreshBiteOpsCenter
      lessonId={lessonId}
      initialTaskId={initialTaskId}
      onClose={onClose || onBack || (() => undefined)}
      onFresherTransitionReady={() => navigate("/learning")}
    />
  );
}

export default LessonWorkspaceChallenge;
