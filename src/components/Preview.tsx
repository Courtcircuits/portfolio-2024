import {
  useEffect,
  useRef,
  type MouseEventHandler,
  type ReactNode,
} from "react";

import { AnimatePresence, motion } from "framer-motion";
import { atom } from "nanostores";
import { useStore } from "@nanostores/react";

export const isVisible = atom(false);
export const offsetY = atom(0);
export const offsetX = atom(0);

export function Preview({ children }: { children: ReactNode }) {
  return (
    <AnimatePresence>
      <div className="relative inline-block">{children}</div>
    </AnimatePresence>
  );
}

function Trigger({ children }: { children: ReactNode }) {
  return (
    <span
      onMouseOver={(e) => {
        isVisible.set(true);
      }}
      onMouseMove={(e) => {
        offsetX.set(e.nativeEvent.offsetX);
        offsetY.set(e.nativeEvent.offsetY);
      }}
      onMouseOut={() => {
        isVisible.set(false);
      }}
    >
      {children}
    </span>
  );
}

function Content({ children }: { children: ReactNode }) {
  const $isVisible = useStore(isVisible);
  const $offsetX = useStore(offsetX);
  const $offsetY = useStore(offsetY);

  return $isVisible && $offsetX && $offsetY ? (
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
