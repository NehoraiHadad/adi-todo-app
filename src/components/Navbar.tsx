'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    try {
      // Close the mobile menu if it's open
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
      
      // Call the signOut function from AuthContext
      await signOut();
      
      // No need for router.push here, the signOut function will handle redirection
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return '?';
    
    // Use display_name from user_metadata if available, otherwise fallback to email
    const displayName = user.user_metadata?.display_name || user.email;
    if (!displayName) return '?';
    
    // If display name has multiple words, use first letter of each word (up to 2 words)
    if (displayName.includes(' ')) {
      const words = displayName.split(' ').filter((word: string) => word.length > 0);
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase();
      }
    }
    
    // For single names, if name is 3 chars or less, use the full name
    if (displayName.length <= 3) {
      return displayName.toUpperCase();
    }
    
    // Default to first 2 characters
    return displayName.substring(0, 2).toUpperCase();
  };
  
  return (
    <nav className="bg-gradient-to-r from-indigo-400 to-purple-500 shadow-md border-b-4 border-yellow-300 text-white">
      <div className="container-app">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-3xl">🏫</span>
              <span className="text-2xl font-bold text-white ms-2">כיתה דיגיטלית</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-reverse md:space-x-6">
            <Button 
              asChild
              variant={isActive('/') ? "secondary" : "ghost"}
              className={`font-medium ${isActive('/') ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-300 hover:text-white'}`}
            >
              <Link href="/">
                <span className="text-xl ml-1">🏠</span>
                בית
              </Link>
            </Button>
            
            <Button 
              asChild
              variant={isActive('/schedule') ? "secondary" : "ghost"}
              className={`font-medium ${isActive('/schedule') ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-300 hover:text-white'}`}
            >
              <Link href="/schedule">
                <span className="text-xl ml-1">📅</span>
                מערכת שעות
              </Link>
            </Button>
            
            <Button 
              asChild
              variant={isActive('/tasks') ? "secondary" : "ghost"}
              className={`font-medium ${isActive('/tasks') ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-300 hover:text-white'}`}
            >
              <Link href="/tasks">
                <span className="text-xl ml-1">✏️</span>
                משימות
              </Link>
            </Button>
            
            <Button 
              asChild
              variant={isActive('/equipment') ? "secondary" : "ghost"}
              className={`font-medium ${isActive('/equipment') ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-300 hover:text-white'}`}
            >
              <Link href="/equipment">
                <span className="text-xl ml-1">🎒</span>
                ציוד יומי
              </Link>
            </Button>
            
            <Button 
              asChild
              variant={isActive('/rewards') ? "secondary" : "ghost"}
              className={`font-medium ${isActive('/rewards') ? 'bg-white text-indigo-600' : 'text-white hover:bg-indigo-300 hover:text-white'}`}
            >
              <Link href="/rewards">
                <span className="text-xl ml-1">🏆</span>
                פרסים
              </Link>
            </Button>

            {/* User Profile or Login Button */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer border-2 border-white">
                    <AvatarImage src="" alt={user.user_metadata?.display_name || user.email || 'User'} />
                    <AvatarFallback className="bg-yellow-400 text-indigo-700">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="w-full">הפרופיל שלי</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings" className="w-full">הגדרות</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    התנתק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                asChild
                variant="secondary"
                className="bg-white text-indigo-600 hover:bg-yellow-100"
              >
                <Link href="/login">
                  <span className="text-xl ml-1">👤</span>
                  התחברות
                </Link>
              </Button>
            )}
          </div>
          
          {/* Mobile menu using Sheet */}
          <div className="flex items-center md:hidden">
            {/* User Profile Button for Mobile */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer border-2 border-white mr-2">
                    <AvatarImage src="" alt={user.user_metadata?.display_name || user.email || 'User'} />
                    <AvatarFallback className="bg-yellow-400 text-indigo-700">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>החשבון שלי</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/profile" className="w-full">הפרופיל שלי</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings" className="w-full">הגדרות</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    התנתק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-indigo-300">
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
              <SheetContent side="right" className="bg-indigo-100 w-[240px] pt-8">
                <SheetTitle className="sr-only">תפריט ניווט</SheetTitle>
                <SheetDescription className="sr-only">תפריט ניווט לדפים השונים באתר</SheetDescription>
                <div className="flex flex-col space-y-3">
                  <Button 
                    asChild
                    variant={isActive('/') ? "default" : "ghost"}
                    className={`justify-start text-lg font-medium ${
                      isActive('/') 
                        ? 'bg-indigo-500 text-white' 
                        : 'text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    <Link href="/">
                      <span className="text-xl ml-2">🏠</span>
                      בית
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild
                    variant={isActive('/schedule') ? "default" : "ghost"}
                    className={`justify-start text-lg font-medium ${
                      isActive('/schedule') 
                        ? 'bg-indigo-500 text-white' 
                        : 'text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    <Link href="/schedule">
                      <span className="text-xl ml-2">📅</span>
                      מערכת שעות
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild
                    variant={isActive('/tasks') ? "default" : "ghost"}
                    className={`justify-start text-lg font-medium ${
                      isActive('/tasks') 
                        ? 'bg-indigo-500 text-white' 
                        : 'text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    <Link href="/tasks">
                      <span className="text-xl ml-2">✏️</span>
                      משימות
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild
                    variant={isActive('/equipment') ? "default" : "ghost"}
                    className={`justify-start text-lg font-medium ${
                      isActive('/equipment') 
                        ? 'bg-indigo-500 text-white' 
                        : 'text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    <Link href="/equipment">
                      <span className="text-xl ml-2">🎒</span>
                      ציוד יומי
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild
                    variant={isActive('/rewards') ? "default" : "ghost"}
                    className={`justify-start text-lg font-medium ${
                      isActive('/rewards') 
                        ? 'bg-indigo-500 text-white' 
                        : 'text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    <Link href="/rewards">
                      <span className="text-xl ml-2">🏆</span>
                      פרסים
                    </Link>
                  </Button>

                  {/* Login/Logout Button for Mobile */}
                  {!user && (
                    <Button 
                      asChild
                      variant={isActive('/login') ? "default" : "outline"}
                      className={`justify-start text-lg font-medium ${
                        isActive('/login') 
                          ? 'bg-indigo-500 text-white' 
                          : 'text-indigo-700 hover:bg-indigo-200 border-indigo-500'
                      }`}
                    >
                      <Link href="/login">
                        <span className="text-xl ml-2">👤</span>
                        התחברות
                      </Link>
                    </Button>
                  )}

                  {user && (
                    <Button 
                      onClick={handleSignOut}
                      variant="outline"
                      className="justify-start text-lg font-medium text-red-600 border-red-500 hover:bg-red-100"
                    >
                      <span className="text-xl ml-2">🚪</span>
                      התנתק
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
} 