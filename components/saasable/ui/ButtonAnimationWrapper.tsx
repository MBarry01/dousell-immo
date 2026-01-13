'use client';
import { motion } from 'framer-motion';

/***************************  COMMON - BUTTON ANIMATION  ***************************/

export default function ButtonAnimationWrapper({ children, style }: { children: React.ReactNode, style?: any }) {
    return (
        <motion.div
            whileHover={{ scale: 1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            tabIndex={-1}
            style={style}
        >
            {children}
        </motion.div>
    );
}
