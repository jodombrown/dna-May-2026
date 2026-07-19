/**
 * DrawerContext — the single state owner for every drawer surface in DNA.
 *
 * BD135: one shell, independent surfaces. The shell owns chrome and navigation
 * mechanics; a surface owns only its content.
 *
 * ── The URL is the state (DR1 step 4) ─────────────────────────────────────
 * There is no separate stack array. What is open is whatever `?drawer=` says is
 * open, and the stack IS the browser history. That gives, for free and without
 * a line of per-surface code:
 *
 *   · browser back and Android back close a drawer   (did not work before)
 *   · a drawer survives a refresh                    (did not work before)
 *   · a drawer is deep-linkable and shareable        (did not work before)
 *   · back can never disagree with the stack, because there is only one stack
 *
 * The cost, taken deliberately: a surface can no longer be pushed as an
 * arbitrary React node, because a React node cannot live in a URL. Surfaces and
 * panels are RESOLVED FROM AN ID via `resolvers`. That constraint is the same
 * one that makes deep-linking possible, so it is a feature wearing a cost's
 * clothing.
 */

import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DEFAULT_HANDEDNESS, type Handedness } from '@/components/drawer/constants';
import {
  DRAWER_PARAM,
  parseStack,
  serializeStack,
  stackDepth,
  isValidId,
  type SerializedSurface,
} from '@/components/drawer/stackUrl';

export interface ResolvedFrame {
  title: string;
  node: React.ReactNode;
}

export interface DrawerResolvers {
  /** Surface root by id. Returning null closes the drawer (unknown id in a URL). */
  surface: (surfaceId: string) => ResolvedFrame | null;
  /** Panel by id, within a surface. */
  panel: (surfaceId: string, panelId: string) => ResolvedFrame | null;
}

interface DrawerContextValue {
  isOpen: boolean;
  stack: SerializedSurface[];
  depth: number;
  handedness: Handedness;
  /** The frame the member is looking at. */
  currentFrame: ResolvedFrame | null;
  /** Stable key for the current frame. Also the scroll-memory key. */
  currentKey: string | null;

  openSurface: (surfaceId: string) => void;
  swapToSurface: (surfaceId: string) => void;
  pushPanel: (panelId: string) => void;
  back: () => void;
  close: () => void;

  getScroll: (key: string) => number;
  setScroll: (key: string, top: number) => void;
}

const DrawerContext = React.createContext<DrawerContextValue | null>(null);

export function useDrawer() {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) throw new Error('useDrawer must be used inside <DrawerProvider />');
  return ctx;
}

export function useDrawerSafe() {
  return React.useContext(DrawerContext);
}

export function DrawerProvider({
  children,
  resolvers,
  handedness = DEFAULT_HANDEDNESS,
}: {
  children: React.ReactNode;
  resolvers: DrawerResolvers;
  handedness?: Handedness;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const scrollMemory = React.useRef<Map<string, number>>(new Map());

  const raw = searchParams.get(DRAWER_PARAM);
  const stack = React.useMemo(() => parseStack(raw), [raw]);
  const depth = stackDepth(stack);

  /** Writes the stack to the URL. Each write PUSHES, so back pops one level. */
  const writeStack = React.useCallback(
    (next: SerializedSurface[]) => {
      const params = new URLSearchParams(searchParams);
      if (next.length === 0) params.delete(DRAWER_PARAM);
      else params.set(DRAWER_PARAM, serializeStack(next));
      setSearchParams(params, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const openSurface = React.useCallback(
    (surfaceId: string) => {
      if (!isValidId(surfaceId)) return;
      // Replaces, never appends. Surfaces do not nest (BD135 rule 3).
      writeStack([{ surfaceId, panelIds: [] }]);
    },
    [writeStack],
  );

  const swapToSurface = React.useCallback(
    (surfaceId: string) => {
      if (!isValidId(surfaceId)) return;
      // Origin is SUSPENDED beneath, not rendered inside. Back restores it.
      writeStack([...stack, { surfaceId, panelIds: [] }]);
    },
    [stack, writeStack],
  );

  const pushPanel = React.useCallback(
    (panelId: string) => {
      if (!isValidId(panelId) || stack.length === 0) return;
      const head = stack.slice(0, -1);
      const top = stack[stack.length - 1];
      writeStack([...head, { ...top, panelIds: [...top.panelIds, panelId] }]);
    },
    [stack, writeStack],
  );

  /**
   * Back is browser back. Not a reimplementation of it, not a parallel stack
   * that can drift from it — the same call the hardware button makes. BD135
   * rule 4 ("back derived from stack depth, never hand-wired per surface") is
   * satisfied because there is exactly one stack and the browser owns it.
   */
  const back = React.useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /**
   * Close unwinds every drawer entry this session pushed, so the member lands
   * back on the page they were reading rather than stepping out one panel at a
   * time. Falls back to a param strip when the drawer was deep-linked into
   * directly and there is no history to unwind.
   */
  const close = React.useCallback(() => {
    if (depth > 0 && window.history.state?.idx >= depth) {
      navigate(-depth);
      return;
    }
    const params = new URLSearchParams(searchParams);
    params.delete(DRAWER_PARAM);
    setSearchParams(params, { replace: true });
  }, [depth, navigate, searchParams, setSearchParams]);

  const getScroll = React.useCallback((key: string) => scrollMemory.current.get(key) ?? 0, []);
  const setScroll = React.useCallback((key: string, top: number) => {
    scrollMemory.current.set(key, top);
  }, []);

  // Resolve the visible frame from ids. An unknown id yields null, which the
  // shell renders as nothing rather than as a broken panel.
  const top = stack.length > 0 ? stack[stack.length - 1] : null;
  let currentFrame: ResolvedFrame | null = null;
  let currentKey: string | null = null;
  if (top) {
    if (top.panelIds.length > 0) {
      const panelId = top.panelIds[top.panelIds.length - 1];
      currentFrame = resolvers.panel(top.surfaceId, panelId);
      currentKey = `${top.surfaceId}.${panelId}`;
    } else {
      currentFrame = resolvers.surface(top.surfaceId);
      currentKey = top.surfaceId;
    }
  }

  const value = React.useMemo<DrawerContextValue>(
    () => ({
      isOpen: stack.length > 0 && currentFrame !== null,
      stack,
      depth,
      handedness,
      currentFrame,
      currentKey,
      openSurface,
      swapToSurface,
      pushPanel,
      back,
      close,
      getScroll,
      setScroll,
    }),
    [
      stack, depth, handedness, currentFrame, currentKey,
      openSurface, swapToSurface, pushPanel, back, close, getScroll, setScroll,
    ],
  );

  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}
