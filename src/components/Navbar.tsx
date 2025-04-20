'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from '@/context/AuthContext';
import { 
  Avatar,
  AvatarFallback,
  AvatarImage 
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define User type based on the structure used in the application
type UserType = {
  email?: string;
  user_metadata?: {
    display_name?: string;
  };
};

type NavLinkProps = {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
};

// NavLink component for desktop menu
const DesktopNavLink = ({ href, icon, label, isActive }: NavLinkProps) => (
  <Button 
    asChild
    variant={isActive ? "secondary" : "ghost"}
    className={`font-medium px-2 md:px-3 lg:px-4 text-sm md:text-base ${isActive ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-300 hover:text-white'}`}
  >
    <Link href={href}>
      <span className="text-xl ml-1">{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </Link>
  </Button>
);

// NavLink component for mobile menu
const MobileNavLink = ({ href, icon, label, isActive }: NavLinkProps) => (
  <Button 
    asChild
    variant={isActive ? "default" : "ghost"}
    className={`justify-start text-lg font-medium h-14 ${
      isActive 
        ? 'bg-indigo-500 text-white shadow-md' 
        : 'text-indigo-700 hover:bg-indigo-200'
    }`}
  >
    <Link href={href}>
      <span className="text-xl ml-2">{icon}</span>
      {label}
    </Link>
  </Button>
);

// User Profile Avatar Component
const UserAvatar = ({ user, getUserInitials, isMobile = false }: { 
  user: UserType; 
  getUserInitials: () => string;
  isMobile?: boolean;
}) => (
  <Avatar className={`cursor-pointer border-2 border-white ${isMobile ? 'mr-4' : ''}`}>
    <AvatarImage src="" alt={user.user_metadata?.display_name || user.email || 'User'} />
    <AvatarFallback className="bg-yellow-400 text-indigo-700">
      {getUserInitials()}
    </AvatarFallback>
  </Avatar>
);

// User Menu Component - combines trigger and content
const UserMenu = ({ user, getUserInitials, handleSignOut, isMobile = false }: {
  user: UserType;
  getUserInitials: () => string;
  handleSignOut: () => void;
  isMobile?: boolean;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button 
        variant="ghost" 
        className="p-0 h-auto bg-transparent hover:bg-transparent hover:scale-105 transition-transform"
      >
        <UserAvatar user={user} getUserInitials={getUserInitials} isMobile={isMobile} />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent 
      align="end" 
      className={`${isMobile ? 'w-64' : 'w-56'} z-50 shadow-lg rounded-xl border-2 border-indigo-200 p-2 bg-gradient-to-b from-white to-indigo-50 font-medium`}
    >
      
      <DropdownMenuItem className="flex items-center gap-2 rounded-lg hover:bg-indigo-100 focus:bg-indigo-100 cursor-pointer my-1.5 p-2.5 transition-colors">
        <span className="text-xl bg-yellow-100 p-1 rounded-md">👤</span>
        <Link href="/profile" className="w-full text-center">הפרופיל שלי</Link>
      </DropdownMenuItem>
      
      <DropdownMenuItem className="flex items-center gap-2 rounded-lg hover:bg-indigo-100 focus:bg-indigo-100 cursor-pointer my-1.5 p-2.5 transition-colors">
        <span className="text-xl bg-indigo-100 p-1 rounded-md">⚙️</span>
        <Link href="/settings" className="w-full text-center">הגדרות</Link>
      </DropdownMenuItem>
      
      <DropdownMenuSeparator className="my-2 h-0.5 bg-indigo-100 rounded-full" />
      
      <DropdownMenuItem 
        onClick={handleSignOut} 
        className="flex items-center gap-2 rounded-lg hover:bg-red-50 focus:bg-red-50 cursor-pointer p-2.5 my-1.5 text-red-600 transition-colors"
      >
        <span className="text-xl bg-red-100 p-1 rounded-md">🚪</span>
        <span className="w-full text-center">התנתק</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

// Mobile Menu Sheet Content Component
const MobileMenuContent = ({ isActive, handleSignOut, user }: { 
  isActive: (path: string) => boolean;
  handleSignOut: () => void;
  user: UserType | null;
}) => (
  <div className="flex flex-col space-y-4">
    <MobileNavLink href="/" icon="🏠" label="בית" isActive={isActive('/')} />
    <MobileNavLink href="/schedule" icon="📅" label="מערכת לימודים" isActive={isActive('/schedule')} />
    <MobileNavLink href="/tasks" icon="✏️" label="משימות" isActive={isActive('/tasks')} />
    <MobileNavLink href="/equipment" icon="🎒" label="ציוד יומי" isActive={isActive('/equipment')} />
    <MobileNavLink href="/rewards" icon="🏆" label="פרסים" isActive={isActive('/rewards')} />

    {/* Login/Logout Button for Mobile */}
    {!user ? (
      <Button 
        asChild
        variant={isActive('/login') ? "default" : "outline"}
        className={`justify-start text-lg font-medium h-14 ${
          isActive('/login') 
            ? 'bg-indigo-500 text-white shadow-md' 
            : 'text-indigo-700 hover:bg-indigo-200 border-indigo-500'
        }`}
      >
        <Link href="/login">
          <span className="text-xl ml-2">👤</span>
          התחברות
        </Link>
      </Button>
    ) : (
      <Button 
        onClick={handleSignOut}
        variant="outline"
        className="justify-start text-lg font-medium text-red-600 border-red-500 hover:bg-red-100 h-14"
      >
        <span className="text-xl ml-2">🚪</span>
        התנתק
      </Button>
    )}
  </div>
);

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => pathname === path;

  const handleSignOut = async () => {
    try {
      if (isMenuOpen) setIsMenuOpen(false);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '?';
    
    const displayName = user.user_metadata?.display_name || user.email;
    if (!displayName) return '?';
    
    if (displayName.includes(' ')) {
      const words = displayName.split(' ').filter((word: string) => word.length > 0);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
    }
    
    if (displayName.length <= 3) {
      return displayName.toUpperCase();
    }
    
    return displayName.substring(0, 2).toUpperCase();
  };
  
  // Navigation links data
  const navLinks = [
    { href: '/', icon: '🏠', label: 'בית' },
    { href: '/schedule', icon: '📅', label: 'מערכת לימודים' },
    { href: '/tasks', icon: '✏️', label: 'משימות' },
    { href: '/equipment', icon: '🎒', label: 'ציוד יומי' },
    { href: '/rewards', icon: '🏆', label: 'פרסים' },
  ];
  
  return (
    <nav className="bg-gradient-to-r from-indigo-400 to-purple-500 shadow-md border-b-4 border-yellow-300 text-white sticky top-0 z-50">
      <div className="container-app">
        <div className="flex justify-between h-16">
          {/* Logo and Site Title */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-3xl">🏫</span>
              <span className="text-xl sm:text-2xl font-bold text-white ms-2">כיתה דיגיטלית</span>
            </Link>
          </div>
          
          {/* Desktop Menu - only visible on md screens and up */}
          <div className="hidden md:flex md:items-center md:space-x-reverse">
            <div className="flex flex-nowrap items-center justify-end gap-1 md:gap-2 lg:gap-4">
              {navLinks.map((link) => (
                <DesktopNavLink 
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                  label={link.label}
                  isActive={isActive(link.href)}
                />
              ))}

              {/* User Profile or Login Button */}
              {user ? (
                <UserMenu 
                  user={user} 
                  getUserInitials={getUserInitials}
                  handleSignOut={handleSignOut}
                />
              ) : (
                <Button 
                  asChild
                  variant="secondary"
                  className="bg-white text-indigo-600 hover:bg-yellow-100 px-2 md:px-3 lg:px-4 text-sm md:text-base"
                >
                  <Link href="/login">
                    <span className="text-xl ml-1">👤</span>
                    <span className="hidden md:inline">התחברות</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          {/* Mobile menu toggle button - visible below md screens */}
          <div className="flex items-center md:hidden">
            {/* User Profile Button for Mobile */}
            {user && (
              <UserMenu 
                user={user} 
                getUserInitials={getUserInitials}
                handleSignOut={handleSignOut}
                isMobile={true}
              />
            )}

            {/* Mobile menu sheet */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-indigo-300 h-12 w-12 rounded-full">
                  {isMenuOpen ? (
                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                  )}
                  <span className="sr-only">פתח תפריט</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-gradient-to-b from-indigo-100 to-purple-50 w-[280px] pt-10 z-50">
                <SheetTitle className="text-2xl text-center text-indigo-700 mb-6">תפריט ניווט</SheetTitle>
                <MobileMenuContent 
                  isActive={isActive} 
                  handleSignOut={handleSignOut} 
                  user={user} 
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
} 