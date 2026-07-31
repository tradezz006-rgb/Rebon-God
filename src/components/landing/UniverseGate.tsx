/**
 * The single entry gate into REBON.
 * Choose your path → DomainUniverse (solar system) → dive → WorldEntryTransition → learning.
 * Interstellar travel lives HERE so it never gets unmounted with the solar system.
 */
import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
  lazy,
  Suspense,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDomain } from "@/contexts/DomainContext";
import { STATUS_COLOR, type DomainWorld } from "@/data/domains";

const DomainUniverse = lazy(() => import("./DomainUniverse"));
const WorldEntryTransition = lazy(() => import("./WorldEntryTransition"));

interface UniverseGateValue {
  open: () => void;
  close: () => void;
  isOpen: boolean;
}

const UniverseGateContext = createContext<UniverseGateValue | undefined>(
  undefined
);

export const UniverseGateProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  /** World mid-interstellar travel — kept alive after solar system closes */
  const [entryWorld, setEntryWorld] = useState<DomainWorld | null>(null);
  const entryWorldRef = useRef<DomainWorld | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { setDomain } = useDomain();

  useEffect(() => {
    if ((location.state as { autoUniverse?: boolean } | null)?.autoUniverse) {
      setIsOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  /** Solar system finished the dive — hand off to interstellar corridor */
  const beginInterstellar = useCallback((world: DomainWorld) => {
    entryWorldRef.current = world;
    setEntryWorld(world);
    setIsOpen(false);
  }, []);

  /** Corridor finished — land in learning / auth */
  const finishEntry = useCallback(() => {
    const world = entryWorldRef.current;
    entryWorldRef.current = null;
    setEntryWorld(null);
    if (!world) return;
    if (world.route) setDomain(world.route);
    if (user) {
      navigate("/learning");
    } else {
      navigate("/auth", {
        state: { intent: "enter-world", domain: world.route },
      });
    }
  }, [navigate, setDomain, user]);

  const showOverlay = isOpen || Boolean(entryWorld);

  return (
    <UniverseGateContext.Provider
      value={{
        open: () => setIsOpen(true),
        close: () => {
          if (!entryWorldRef.current) setIsOpen(false);
        },
        isOpen,
      }}
    >
      {children}

      {showOverlay && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }
        >
          {/* Keep solar system mounted until travel starts; travel stays mounted after */}
          {isOpen && !entryWorld && (
            <DomainUniverse
              open
              onClose={() => setIsOpen(false)}
              onSelect={beginInterstellar}
            />
          )}

          {entryWorld && (
            <WorldEntryTransition
              key={`travel-${entryWorld.id}`}
              color={STATUS_COLOR[entryWorld.status]}
              label={entryWorld.label}
              onComplete={finishEntry}
            />
          )}
        </Suspense>
      )}
    </UniverseGateContext.Provider>
  );
};

export const useUniverseGate = () => {
  const ctx = useContext(UniverseGateContext);
  if (!ctx)
    throw new Error("useUniverseGate must be used within a UniverseGateProvider");
  return ctx;
};
