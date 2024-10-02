import {
  useEffect,
  useRef,
  type MouseEventHandler,
  type ReactNode,
} from "react";

import { AnimatePresence, motion } from "framer-motion";
import { atom } from "nanostores";
import { useStore } from "@nanostores/react";

export const isVisible = atom<string | null>(null);
export const offsetY = atom(0);
export const offsetX = atom(0);

export function Preview({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence>
      <div className="relative inline-block">{children}</div>
    </AnimatePresence>
  );
}

function Trigger({
  children,
  trigger,
}: {
  children: ReactNode;
  trigger: string;
}) {
  return (
    <span
      onMouseOver={(e) => {
        isVisible.set(trigger);
      }}
      onMouseMove={(e) => {
        offsetX.set(e.nativeEvent.offsetX);
        offsetY.set(e.nativeEvent.offsetY);
      }}
      onMouseOut={() => {
        isVisible.set(null);
      }}
    >
      {children}
    </span>
  );
}

function Content({
  children,
  trigger,
}: {
  children: ReactNode;
  trigger: string;
}) {
  const $isVisible = useStore(isVisible);
  const $offsetX = useStore(offsetX);
  const $offsetY = useStore(offsetY);

  return $isVisible && $isVisible === trigger && $offsetX && $offsetY ? (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      className="m-0 p-0 w-0 absolute"
    >
      <div
        key="modal"
        className="absolute duration-100"
        style={{
          left: $offsetX,
          top: $offsetY - 10,
        }}
      >
        {children}
      </div>
    </motion.div>
  ) : null;
}

Preview.Trigger = Trigger;
Preview.Content = Content;
