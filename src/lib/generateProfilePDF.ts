import jsPDF from 'jspdf';
import {
  CONNECTION_TYPE_OPTIONS,
  RETURN_INTENTIONS_OPTIONS,
  AFRICAN_CAUSES_OPTIONS
} from '@/data/profileOptions';
import { config } from '@/lib/config';

interface ProfileVisibility {
  about?: 'public' | 'hidden';
  skills?: 'public' | 'hidden';
  interests?: 'public' | 'hidden';
  activity?: 'public' | 'hidden';
}

interface ProfileData {
  display_name?: string;
  full_name?: string;
  username?: string;
  headline?: string;
  professional_role?: string;
  bio?: string;
  location?: string;
  current_country?: string;
  primary_origin_country?: string;
  phone_number?: string;
  whatsapp_number?: string;
  linkedin_url?: string;
  avatar_url?: string;
  skills?: string[];
  interests?: string[];
  focus_areas?: string[];
  available_for?: string[];
  languages?: string[];
  industry?: string;
  years_experience?: number;
  company?: string;
  // Diaspora connection fields
  ethnic_heritage?: string[] | null;
  african_causes?: string[] | null;
  engagement_intentions?: string[] | null;
  return_intentions?: string | null;
  africa_visit_frequency?: string | null;
  diaspora_networks?: string[] | null;
  mentorship_areas?: string[] | null;
  // Contact visibility
  contact_number_visibility?: string;
  visibility?: ProfileVisibility;
  // Is owner viewing (controls what's shown)
  isOwnerView?: boolean;
}

// Helper functions to get labels from values


const getReturnIntentionsLabel = (value: string | null | undefined): string => {
  if (!value) return '';
  const option = RETURN_INTENTIONS_OPTIONS.find(o => o.value === value);
  return option ? option.label : value;
};

const getCauseLabel = (value: string): string => {
  const option = AFRICAN_CAUSES_OPTIONS.find(o => o.value === value);
  return option ? option.label : value;
};

// DNA Brand Colors
const DNA_COLORS = {
  dark: '#1C3D3C',       // DNA forest/dark green
  accent: '#D4A574',     // DNA copper/gold
  emerald: '#10B981',    // DNA emerald
  text: '#1F2937',       // Dark gray text
  lightText: '#6B7280',  // Muted text
  white: '#FFFFFF',
  sidebarText: '#E5E7EB',
};

/**
 * @param ownerEmail Owner's email sourced from supabase.auth (NOT the profiles row).
 *   Rendered only in the owner's own export; profiles no longer exposes email.
 */
export async function generateProfilePDF(profile: ProfileData, ownerEmail?: string): Promise<void> {
  // Determine visibility - if owner viewing, show everything; otherwise respect settings
  const isOwner = profile.isOwnerView ?? true; // Default to owner view for backward compatibility
  const visibility = profile.visibility as ProfileVisibility | undefined;
  
  // Helper to check if section should be shown
  const shouldShowSection = (section: keyof ProfileVisibility): boolean => {
    if (isOwner) return true; // Owner sees everything
    if (!visibility) return true; // No settings = default public
    return visibility[section] !== 'hidden';
  };
  
  // Helper to check contact visibility
  const shouldShowContact = (type: 'phone' | 'whatsapp'): boolean => {
    if (isOwner) return true;
    return profile.contact_number_visibility === type;
  };
  
  // Create PDF in Letter size (8.5 x 11 inches = 215.9 x 279.4 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth(); // 215.9mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 279.4mm
  
  const sidebarWidth = 72;
  const mainWidth = pageWidth - sidebarWidth;
  const margin = 10;
  const footerHeight = 18;
  
  // Maximum Y positions to prevent overflow (leave room for footer)
  const sidebarMaxY = pageHeight - footerHeight - 10;
  const mainMaxY = pageHeight - footerHeight - 10;
  
  // Draw dark sidebar
  doc.setFillColor(28, 61, 60); // DNA forest
  doc.rect(0, 0, sidebarWidth, pageHeight, 'F');
  
  // Draw main content area
  doc.setFillColor(255, 255, 255);
  doc.rect(sidebarWidth, 0, mainWidth, pageHeight, 'F');
  
  // Avatar placeholder (circle)
  const avatarSize = 48;
  const avatarX = sidebarWidth / 2;
  const avatarY = 40;
  
  // Draw avatar circle background
  doc.setFillColor(212, 165, 116); // DNA copper
  doc.circle(avatarX, avatarY, avatarSize / 2, 'F');
  
  // If avatar URL exists, try to load it
  if (profile.avatar_url) {
    try {
      const img = await loadImage(profile.avatar_url);
      doc.addImage(img, 'JPEG', avatarX - avatarSize/2, avatarY - avatarSize/2, avatarSize, avatarSize);
    } catch (e) {
      // Draw initials if image fails
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      const initials = getInitials(profile.display_name || profile.full_name || profile.username || 'U');
      doc.text(initials, avatarX, avatarY + 3, { align: 'center' });
    }
  } else {
    // Draw initials
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const initials = getInitials(profile.display_name || profile.full_name || profile.username || 'U');
    doc.text(initials, avatarX, avatarY + 3, { align: 'center' });
  }
  
  let sidebarY = avatarY + avatarSize / 2 + 12;
  
  // Helper to check if sidebar has space for a section
  const hasSidebarSpace = (neededHeight: number): boolean => {
    return sidebarY + neededHeight < sidebarMaxY;
  };
  
  // Contact Section (respects visibility)
  if (hasSidebarSpace(20)) {
    sidebarY = drawSidebarSection(doc, 'CONTACT', sidebarY, sidebarWidth, margin);
    
    if (ownerEmail && isOwner && hasSidebarSpace(10)) {
      sidebarY = drawSidebarItem(doc, 'Email:', ownerEmail, sidebarY, sidebarWidth, margin);
    }
    if (profile.linkedin_url && hasSidebarSpace(10)) {
      const linkedinHandle = profile.linkedin_url.includes('linkedin.com') 
        ? profile.linkedin_url.split('/').filter(Boolean).pop() || 'LinkedIn'
        : profile.linkedin_url;
      sidebarY = drawSidebarItem(doc, 'LinkedIn:', linkedinHandle, sidebarY, sidebarWidth, margin);
    }
    if (profile.phone_number && shouldShowContact('phone') && hasSidebarSpace(10)) {
      sidebarY = drawSidebarItem(doc, 'Phone:', profile.phone_number, sidebarY, sidebarWidth, margin);
    }
    if (profile.whatsapp_number && shouldShowContact('whatsapp') && hasSidebarSpace(10)) {
      sidebarY = drawSidebarItem(doc, 'WhatsApp:', profile.whatsapp_number, sidebarY, sidebarWidth, margin);
    }
    if ((profile.location || profile.current_country) && hasSidebarSpace(10)) {
      sidebarY = drawSidebarItem(doc, 'Location:', profile.location || profile.current_country || '', sidebarY, sidebarWidth, margin);
    }
    
    sidebarY += 4;
  }
  
  // My Connection to Africa Section (Enhanced Heritage Section)
  const hasConnectionData = profile.primary_origin_country || 
    (profile.languages && profile.languages.length > 0) ||
    (profile.ethnic_heritage && profile.ethnic_heritage.length > 0) ||
    (profile.diaspora_networks && profile.diaspora_networks.length > 0);
    
  if (hasConnectionData && hasSidebarSpace(20)) {
    sidebarY = drawSidebarSection(doc, 'AFRICA CONNECTION', sidebarY, sidebarWidth, margin);
    
    if (profile.primary_origin_country && hasSidebarSpace(10)) {
      sidebarY = drawSidebarItem(doc, 'Origin:', profile.primary_origin_country, sidebarY, sidebarWidth, margin);
    }
    if (profile.ethnic_heritage && profile.ethnic_heritage.length > 0 && hasSidebarSpace(10)) {
      sidebarY = drawSidebarItem(doc, 'Heritage:', profile.ethnic_heritage.slice(0, 2).join(', '), sidebarY, sidebarWidth, margin);
    }
    if (profile.languages && profile.languages.length > 0 && hasSidebarSpace(10)) {
      sidebarY = drawSidebarItem(doc, 'Languages:', profile.languages.slice(0, 3).join(', '), sidebarY, sidebarWidth, margin);
    }
    if (profile.diaspora_networks && profile.diaspora_networks.length > 0 && hasSidebarSpace(10)) {
      sidebarY = drawSidebarItem(doc, 'Networks:', profile.diaspora_networks.slice(0, 2).join(', '), sidebarY, sidebarWidth, margin);
    }
    sidebarY += 4;
  }
  
  // Skills Section (respects visibility) - limit items based on space
  if (profile.skills && profile.skills.length > 0 && shouldShowSection('skills') && hasSidebarSpace(18)) {
    sidebarY = drawSidebarSection(doc, 'SKILLS', sidebarY, sidebarWidth, margin);
    
    const maxSkills = Math.min(6, profile.skills.length);
    for (let i = 0; i < maxSkills; i++) {
      if (!hasSidebarSpace(6)) break;
      sidebarY = drawSidebarBullet(doc, profile.skills[i], sidebarY, sidebarWidth, margin);
    }
    sidebarY += 4;
  }
  
  // Focus Areas Section - limit items based on space
  if (profile.focus_areas && profile.focus_areas.length > 0 && hasSidebarSpace(18)) {
    sidebarY = drawSidebarSection(doc, 'FOCUS AREAS', sidebarY, sidebarWidth, margin);
    
    const maxAreas = Math.min(4, profile.focus_areas.length);
    for (let i = 0; i < maxAreas; i++) {
      if (!hasSidebarSpace(6)) break;
      sidebarY = drawSidebarBullet(doc, profile.focus_areas[i], sidebarY, sidebarWidth, margin);
    }
    sidebarY += 4;
  }
  
  // Available For Section - only if space allows
  if (profile.available_for && profile.available_for.length > 0 && hasSidebarSpace(18)) {
    sidebarY = drawSidebarSection(doc, 'OPEN TO', sidebarY, sidebarWidth, margin);
    
    const maxItems = Math.min(4, profile.available_for.length);
    for (let i = 0; i < maxItems; i++) {
      if (!hasSidebarSpace(6)) break;
      sidebarY = drawSidebarBullet(doc, profile.available_for[i], sidebarY, sidebarWidth, margin);
    }
    sidebarY += 4;
  }
  
  // Mentorship Areas - use remaining sidebar space
  if (profile.mentorship_areas && profile.mentorship_areas.length > 0 && hasSidebarSpace(18)) {
    sidebarY = drawSidebarSection(doc, 'MENTORSHIP', sidebarY, sidebarWidth, margin);
    
    const maxItems = Math.min(3, profile.mentorship_areas.length);
    for (let i = 0; i < maxItems; i++) {
      if (!hasSidebarSpace(6)) break;
      sidebarY = drawSidebarBullet(doc, profile.mentorship_areas[i], sidebarY, sidebarWidth, margin);
    }
  }
  
  // Main Content Area
  let mainY = 30;
  const mainX = sidebarWidth + 15;
  const mainContentWidth = mainWidth - 30;
  
  // Name - using DNA copper color
  doc.setTextColor(212, 165, 116); // DNA copper
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  const displayName = profile.display_name || profile.full_name || profile.username || 'DNA Member';
  doc.text(displayName.toUpperCase(), mainX, mainY);
  mainY += 12;
  
  // Professional Title
  if (profile.headline || profile.professional_role) {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const title = profile.headline || profile.professional_role || '';
    doc.text(title.toUpperCase(), mainX, mainY);
    mainY += 8;
  }
  
  // Company & Experience
  if (profile.company || profile.years_experience) {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(10);
    let companyLine = '';
    if (profile.company) companyLine += profile.company;
    if (profile.years_experience) {
      companyLine += companyLine ? ` • ${profile.years_experience} years experience` : `${profile.years_experience} years experience`;
    }
    doc.text(companyLine, mainX, mainY);
    mainY += 5;
  }
  
  mainY += 8;
  
  // Professional Summary (about section - respects visibility)
  if (profile.bio && shouldShowSection('about')) {
    mainY = drawMainSection(doc, 'PROFESSIONAL SUMMARY', mainY, mainX, mainContentWidth);
    
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const bioLines = doc.splitTextToSize(profile.bio, mainContentWidth);
    doc.text(bioLines, mainX, mainY);
    mainY += bioLines.length * 5 + 8;
  }
  
  // African Causes Section
  if (profile.african_causes && profile.african_causes.length > 0) {
    mainY = drawMainSection(doc, 'CAUSES I CARE ABOUT', mainY, mainX, mainContentWidth);
    
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const causesText = profile.african_causes.map(c => getCauseLabel(c)).join(' • ');
    const causeLines = doc.splitTextToSize(causesText, mainContentWidth);
    doc.text(causeLines, mainX, mainY);
    mainY += causeLines.length * 5 + 8;
  }
  
  // Engagement Intentions Section
  if (profile.engagement_intentions && profile.engagement_intentions.length > 0) {
    mainY = drawMainSection(doc, 'HERE TO', mainY, mainX, mainContentWidth);
    
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const intentionsText = profile.engagement_intentions.join(' • ');
    const intentionLines = doc.splitTextToSize(intentionsText, mainContentWidth);
    doc.text(intentionLines, mainX, mainY);
    mainY += intentionLines.length * 5 + 8;
  }
  
  // Interests Section (respects visibility)
  if (profile.interests && profile.interests.length > 0 && shouldShowSection('interests')) {
    mainY = drawMainSection(doc, 'INTERESTS & PASSIONS', mainY, mainX, mainContentWidth);
    
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const interestsText = profile.interests.join(' • ');
    const interestLines = doc.splitTextToSize(interestsText, mainContentWidth);
    doc.text(interestLines, mainX, mainY);
    mainY += interestLines.length * 5 + 8;
  }
  
  // Industry Section
  if (profile.industry) {
    mainY = drawMainSection(doc, 'INDUSTRY', mainY, mainX, mainContentWidth);
    
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.industry, mainX, mainY);
    mainY += 10;
  }
  
  // Return Intentions - if available and space permits
  if (profile.return_intentions && mainY < mainMaxY - 20) {
    mainY = drawMainSection(doc, 'RETURN INTENTIONS', mainY, mainX, mainContentWidth);
    
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(getReturnIntentionsLabel(profile.return_intentions), mainX, mainY);
    mainY += 10;
  }
  
  // Visit Frequency - if available and space permits
  if (profile.africa_visit_frequency && mainY < mainMaxY - 20) {
    mainY = drawMainSection(doc, 'AFRICA VISITS', mainY, mainX, mainContentWidth);
    
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.africa_visit_frequency, mainX, mainY);
    mainY += 10;
  }
  
  // DNA Footer Bar
  doc.setFillColor(212, 165, 116); // DNA copper
  doc.rect(sidebarWidth, pageHeight - footerHeight, mainWidth, footerHeight, 'F');
  
  doc.setTextColor(28, 61, 60); // DNA forest
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DIASPORA NETWORK OF AFRICA', sidebarWidth + mainWidth / 2, pageHeight - 10, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(config.APP_DOMAIN, sidebarWidth + mainWidth / 2, pageHeight - 5, { align: 'center' });
  
  // Save the PDF
  const fileName = `${(profile.username || profile.display_name || 'profile').replace(/\s+/g, '_')}_DNA_Profile.pdf`;
  doc.save(fileName);
}

function drawSidebarSection(doc: jsPDF, title: string, y: number, sidebarWidth: number, margin: number): number {
  doc.setTextColor(212, 165, 116); // DNA copper
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, y);
  
  // Underline
  doc.setDrawColor(212, 165, 116);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 1.5, sidebarWidth - margin, y + 1.5);
  
  return y + 8;
}

function drawSidebarItem(doc: jsPDF, label: string, text: string, y: number, sidebarWidth: number, margin: number): number {
  // Label in accent color
  doc.setTextColor(212, 165, 116);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(label, margin, y);
  
  // Value in light text
  doc.setTextColor(229, 231, 235); // Light gray
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  const maxWidth = sidebarWidth - margin * 2;
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, margin, y + 3);
  
  return y + (lines.length * 3.5) + 5;
}

function drawSidebarBullet(doc: jsPDF, text: string, y: number, sidebarWidth: number, margin: number): number {
  // Bullet in accent color
  doc.setTextColor(212, 165, 116);
  doc.setFontSize(7);
  doc.text('•', margin + 2, y);
  
  // Text in light color
  doc.setTextColor(229, 231, 235);
  doc.setFont('helvetica', 'normal');
  
  const maxWidth = sidebarWidth - margin * 2 - 8;
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, margin + 6, y);
  
  return y + (lines.length * 3.5) + 2;
}

function drawMainSection(doc: jsPDF, title: string, y: number, x: number, width: number): number {
  doc.setTextColor(51, 51, 51);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title, x, y);
  
  // Underline in DNA copper
  doc.setDrawColor(212, 165, 116);
  doc.setLineWidth(0.5);
  doc.line(x, y + 1.5, x + Math.min(width * 0.5, 70), y + 1.5);
  
  return y + 9;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
