import React from 'react';
import {
  Utensils,
  Plane,
  ShoppingBag,
  GraduationCap,
  Activity,
  FileText,
  Film,
  Home,
  Briefcase,
  Laptop,
  TrendingUp,
  HelpCircle,
  LucideProps,
} from 'lucide-react';
import { Category } from '../../types';

interface CategoryIconProps extends LucideProps {
  category: Category | string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, ...props }) => {
  switch (category) {
    case 'Food':
      return <Utensils {...props} />;
    case 'Travel':
      return <Plane {...props} />;
    case 'Shopping':
      return <ShoppingBag {...props} />;
    case 'Education':
      return <GraduationCap {...props} />;
    case 'Healthcare':
      return <Activity {...props} />;
    case 'Bills':
      return <FileText {...props} />;
    case 'Entertainment':
      return <Film {...props} />;
    case 'Rent':
      return <Home {...props} />;
    case 'Salary':
      return <Briefcase {...props} />;
    case 'Freelance':
      return <Laptop {...props} />;
    case 'Investments':
      return <TrendingUp {...props} />;
    case 'Other':
    default:
      return <HelpCircle {...props} />;
  }
};
