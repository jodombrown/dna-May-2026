/**
 * PublicSiteHeader
 *
 * Lightweight, non-fixed marketing header used on publicly-shareable pages
 * (PublicPostPage, PublicEventPage). Mirrors the landing page chrome shown
 * to signed-out visitors: DNA logo left, hamburger menu right on mobile,
 * About / Sign In / Join Now on desktop.
 *
 * Intentionally does NOT show the authenticated user's chrome (search bubble,
 * bell, avatar) even when a session exists — public share links must feel
 * like a public landing page so first-time visitors get the FOMO / join CTA.
 */

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ChevronDown } from 'lucide-react';
import dnaLogo from '@/assets/dna-logo.png';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { aboutUsDropdown } from './header/navigationConfig';

export const PublicSiteHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Sign In returns the visitor to the page they were reading, not the feed.
  const signInPath = `/auth?redirect=${encodeURIComponent(
    location.pathname + location.search,
  )}`;

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <header className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src={dnaLogo}
              alt="DNA Logo"
              className="h-12 sm:h-14 w-auto"
              width={86}
              height={48}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-neutral-700 hover:text-dna-forest font-medium">
                  About Us
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {aboutUsDropdown.map((item) => (
                  <DropdownMenuItem
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className="cursor-pointer"
                  >
                    {item.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={() => navigate(signInPath)}
              className="border-dna-copper text-dna-copper hover:bg-dna-copper hover:text-white"
            >
              Sign In
            </Button>
            <Button
              onClick={() => navigate('/auth?mode=signup')}
              className="bg-dna-emerald text-white hover:bg-dna-forest"
            >
              Join Now
            </Button>
          </nav>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden p-1 h-auto w-auto"
                aria-label="Open menu"
              >
                <Menu className="w-8 h-8" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[85vw] max-w-sm p-0 [&>*]:!hidden [&>div]:!block"
              onPointerDownOutside={() => setOpen(false)}
            >
              <div className="flex flex-col h-full max-h-screen">
                <div className="p-4 border-b flex items-center justify-end">
                  <img src={dnaLogo} alt="Logo" className="h-14 w-auto" />
                </div>
                <ScrollArea className="flex-1 overflow-y-auto">
                  <nav className="flex flex-col gap-1 p-4 pb-20">
                    <p className="text-sm text-neutral-600 mb-2 font-medium px-4">About</p>
                    {aboutUsDropdown.map((item) => (
                      <Button
                        key={item.name}
                        variant="ghost"
                        className="justify-start w-full hover:bg-dna-mint/20 hover:text-dna-forest"
                        onClick={() => go(item.path)}
                      >
                        {item.name}
                      </Button>
                    ))}

                    <div className="h-3" />

                    <Button
                      className="justify-start bg-dna-emerald hover:bg-dna-forest text-white"
                      onClick={() => go('/auth?mode=signup')}
                    >
                      Join Now
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => go(signInPath)}
                    >
                      Sign In
                    </Button>
                  </nav>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default PublicSiteHeader;
