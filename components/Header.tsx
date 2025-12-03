
import React from 'react';
import { APP_NAME } from '../constants';
import Button from './Button';

interface HeaderProps {
  onQuickReviewClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onQuickReviewClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md p-4 flex justify-between items-center z-20">
      <h1 className="text-2xl font-bold text-primary">
        {APP_NAME}
      </h1>
      <Button variant="secondary" onClick={onQuickReviewClick}>
        Ôn nhanh 5 phút
      </Button>
    </header>
  );
};

export default Header;
