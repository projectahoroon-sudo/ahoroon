import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Category } from '../types';
import { CategoryIcon } from './CategoryIcon';

interface PremiumCategoryCardProps {
  category: Category;
  index: number;
}

export const PremiumCategoryCard: React.FC<PremiumCategoryCardProps> = (props) => {
  const { category, index } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
      className="group relative"
    >
      <Link
        to={`/category/${category.id}`}
        className="block h-full"
      >
        <div className="relative bg-white border border-[rgba(16,185,129,0.08)] rounded-[20px] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.08)] transition-all duration-350 hover:-translate-y-[10px] hover:scale-[1.04] hover:shadow-[0_25px_50px_rgba(16,185,129,0.2)] hover:bg-[linear-gradient(to_bottom,#ffffff,#F3FFF7)]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-20 h-20 rounded-full bg-[linear-gradient(135deg,#22C55E,#10B981)] flex items-center justify-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] transition-all duration-300 group-hover:rotate-[5deg] group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]">
              <div className="text-white transform transition-transform group-hover:scale-110">
                <CategoryIcon name={category.icon} size={32} strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-[15px] font-bold text-[#1F2937] text-center leading-snug">
              {category.name}
            </h3>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
