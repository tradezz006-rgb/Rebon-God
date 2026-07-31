import { useNavigate } from "react-router-dom";
import FreshBiteOpsCenter from "@/components/cloud/ops/FreshBiteOpsCenter";

interface LessonWorkspaceChallengeProps {
  lessonId: string;
  onBack?: () => void;
  onClose?: () => void;
  /** After act seal / investigation complete — land on session Journey Map */
  onReturnToJourney?: () => void;
  initialTaskId?: string;
  /** Story-mode repair routing: open another act's workspace */
  onSwitchLesson?: (lessonId: string, taskId?: string) => void;
}

export function LessonWorkspaceChallenge({
  lessonId,
  onBack,
  onClose,
  onReturnToJourney,
  initialTaskId,
  onSwitchLesson,
}: LessonWorkspaceChallengeProps) {
  const navigate = useNavigate();

  return (
    <FreshBiteOpsCenter
      lessonId={lessonId}
      initialTaskId={initialTaskId}
      onClose={onClose || onBack || (() => undefined)}
      onReturnToJourney={onReturnToJourney}
      onFresherTransitionReady={() => navigate("/learning")}
      onSwitchLesson={onSwitchLesson}
    />
  );
}

export default LessonWorkspaceChallenge;
