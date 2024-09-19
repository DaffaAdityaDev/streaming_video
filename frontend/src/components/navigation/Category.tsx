"use client";
import React, { useEffect, useState } from 'react';
import { motion, useScroll, AnimatePresence } from 'framer-motion';

const CategoryItem = ({ url, title, isCollapsed }: { url: string, title: string, isCollapsed: boolean }) => {
    const [hover, setHover] = useState(false);
    const categoryStyleAnimation = {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.8 },
      transition: { duration: 0.4, ease: "easeInOut" }
    };
   

    return (
        <AnimatePresence>
            <motion.div
                className={`cursor-pointer flex flex-col items-center justify-center rounded-lg bg-slate-800 py-2 px-12 ${hover ? 'bg-teal-500' : ''}`}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {!isCollapsed && (
                    <motion.img 
                    src={url} 
                    alt={title} 
                    className="h-14 w-14" 
                    initial={categoryStyleAnimation.initial}
                    animate={categoryStyleAnimation.animate}
                    exit={categoryStyleAnimation.exit}
                    transition={categoryStyleAnimation.transition}
                    />
                )}
                
                
                <motion.p
                    className='text-white text-center'
                    initial={categoryStyleAnimation.initial}
                    animate={categoryStyleAnimation.animate}
                    exit={categoryStyleAnimation.exit}
                    transition={categoryStyleAnimation.transition}
                >
                    {title}
                </motion.p>
            
            </motion.div>
        </AnimatePresence>
    );
  };
  

  export default function Category() {
    const [isCollapsed, setIsCollapsed] = useState(true);

    function onMouseEnter() {
      setIsCollapsed(false);
    }

    function onMouseLeave() {
      setIsCollapsed(true);
    }


  
    return (
      <motion.div
        className="m-4 flex flex-row gap-4 justify-between overflow-hidden rounded-lg bg-slate-900 px-2 py-2"
        animate={{
          height: isCollapsed ? '50px' : '100px',
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 10 }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <CategoryItem url="/svg/fire-white.svg" title="Trending" isCollapsed={isCollapsed} />
        <CategoryItem url="/svg/music-white.svg" title="Music" isCollapsed={isCollapsed} />
        <CategoryItem url="/svg/console-white.svg" title="Gaming" isCollapsed={isCollapsed} />
        <CategoryItem url="/svg/newspaper-white.svg" title="News" isCollapsed={isCollapsed} />
        <CategoryItem url="/svg/graduate-white.svg" title="Education" isCollapsed={isCollapsed} />
        <CategoryItem url="/svg/basket-ball-white.svg" title="Sports" isCollapsed={isCollapsed} />
        <CategoryItem url="/svg/clothes-hanger-white.svg" title="Fashion" isCollapsed={isCollapsed} />
      </motion.div>
    );
  }