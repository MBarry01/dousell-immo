"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-[45rem] md:h-[60rem] flex items-center justify-center relative p-2 md:p-20"
      ref={containerRef}
    >
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  const [isAnimationComplete, setIsAnimationComplete] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Détecter quand l'animation est terminée
  React.useEffect(() => {
    const unsubscribe = rotate.on("change", (latest) => {
      if (latest <= 1 && !isAnimationComplete) {
        setIsAnimationComplete(true);
      } else if (latest > 1 && isAnimationComplete) {
        setIsAnimationComplete(false);
      }
    });

    return () => unsubscribe();
  }, [rotate, isAnimationComplete]);

  // Gestion du scroll dans la tablette - TOUJOURS actif
  React.useEffect(() => {
    const card = cardRef.current;
    const content = contentRef.current;

    if (!card || !content) return;

    const handleWheel = (e: WheelEvent) => {
      const isAtTop = content.scrollTop <= 0;
      const isAtBottom =
        content.scrollHeight - content.scrollTop - content.clientHeight < 5;

      const canScrollDown = !isAtBottom && e.deltaY > 0;
      const canScrollUp = !isAtTop && e.deltaY < 0;

      if (canScrollDown || canScrollUp) {
        e.preventDefault();
        e.stopPropagation();
        content.scrollTop += e.deltaY;
      }
    };

    card.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      card.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return (
    <motion.div
      ref={cardRef}
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full border-4 border-[#6C6C6C] p-2 md:p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div
        ref={contentRef}
        className={`h-full w-full rounded-2xl bg-gray-100 dark:bg-zinc-900 md:rounded-2xl transition-all duration-300 ${isAnimationComplete ? "overflow-y-scroll overflow-x-hidden" : "overflow-hidden"
          }`}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#F4C430 #222222",
          WebkitOverflowScrolling: "touch",
          padding: 0,
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};
