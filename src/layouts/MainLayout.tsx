import React, { useState, useEffect } from 'react';
import { User, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LanguageSwitcher from '../components/LanguageSwitcher';
import MobileLanguageToggle from '../components/MobileLanguageToggle';

interface MainLayoutProps {
  children: React.ReactNode;
  pageHeader?: React.ReactNode; // Optional header content
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, pageHeader }) => {
  const { logout, currentUser } = useAuth();
  const { t } = useTranslation();
  const [darkMode, setDarkMode] = useState(false);
  
  // Initialize dark mode from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    
    // Set initial state based on saved preference or default to light mode
    const isDarkMode = savedTheme === 'dark';
    setDarkMode(isDarkMode);
    
    // Apply theme to document
    applyTheme(isDarkMode);
  }, []);
  
  // Toggle between light and dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Save preference to localStorage
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    
    // Apply theme to document
    applyTheme(newDarkMode);
  };
  
  // Apply theme to the document element
  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and brand */}
            <div className="flex items-center space-x-3">
              <img 
                src="/favicon/favicon-96x96.png" 
                alt={t('common.peskasLogo')} 
                className="h-8 w-8 sm:h-10 sm:w-10" 
              />
              <div>
                <h1 className="text-lg font-bold text-foreground sm:text-xl">PESKAS</h1>
                <div className="text-xs text-muted-foreground sm:text-sm">
                  <span className="sm:hidden">v2.0.0</span>
                  <span className="hidden sm:inline">Fishers Tracking Portal v2.0.0</span>
                </div>
              </div>
            </div>            
            {/* Right side actions */}
            <div className="flex items-center space-x-1">
              {/* Dark mode toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                title={darkMode ? t('common.switchToLightMode') : t('common.switchToDarkMode')}
                className="h-9 w-9"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              {/* Language switcher */}
              <LanguageSwitcher />
              <MobileLanguageToggle />
              
              {/* User dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 h-9">
                    <User className="h-4 w-4" />
                    {currentUser?.name && (
                      <span className="hidden text-sm font-medium sm:inline-block max-w-24 truncate">
                        {currentUser.name}
                      </span>
                    )}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      {currentUser?.name && (
                        <div className="text-sm font-medium">{currentUser.name}</div>
                      )}
                      {currentUser?.role && currentUser.role.toLowerCase() !== 'user' && (
                        <Badge variant="secondary" className="w-fit">
                          {currentUser.role}
                        </Badge>
                      )}
                      {currentUser?.imeis && currentUser.imeis.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          IMEI: {currentUser.imeis.join(', ')}
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('navigation.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Page header */}
      {pageHeader}
      
      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default MainLayout; 