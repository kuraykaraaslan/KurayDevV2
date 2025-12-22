#!/bin/bash

# Components Folder Reorganization Script
# This script reorganizes the components folder structure according to best practices
# IMPORTANT: Review changes before committing!

COMPONENTS_DIR="/home/kuray/KurayDevV2/components"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Components Folder Reorganization ===${NC}"
echo -e "${YELLOW}This script will reorganize your components folder.${NC}"
echo -e "${YELLOW}Make sure you have committed your changes before running this!${NC}\n"

# Create new directory structure
create_structure() {
    echo -e "${BLUE}Creating new folder structure...${NC}"
    
    # Common folders
    mkdir -p "$COMPONENTS_DIR/common/Layout/Modal"
    mkdir -p "$COMPONENTS_DIR/common/Layout/Loading"
    mkdir -p "$COMPONENTS_DIR/common/Layout/Logo"
    mkdir -p "$COMPONENTS_DIR/common/UI/Buttons"
    mkdir -p "$COMPONENTS_DIR/common/UI/Images"
    mkdir -p "$COMPONENTS_DIR/common/UI/Navigation"
    mkdir -p "$COMPONENTS_DIR/common/UI/Indicators"
    
    # Admin folders
    mkdir -p "$COMPONENTS_DIR/admin/Layout/Navbar"
    mkdir -p "$COMPONENTS_DIR/admin/Features/AIPrompt"
    mkdir -p "$COMPONENTS_DIR/admin/Features/SlotManagement/SlotTemplateBuilder"
    mkdir -p "$COMPONENTS_DIR/admin/Features/SlotManagement/SlotsEditor"
    mkdir -p "$COMPONENTS_DIR/admin/Features/StatsSection"
    mkdir -p "$COMPONENTS_DIR/admin/UI/Forms/Selects/CategorySelect"
    mkdir -p "$COMPONENTS_DIR/admin/UI/Forms/Selects/UserSelect"
    mkdir -p "$COMPONENTS_DIR/admin/UI/Forms/Editor"
    mkdir -p "$COMPONENTS_DIR/admin/UI/Tables"
    
    # Frontend Layout
    mkdir -p "$COMPONENTS_DIR/frontend/Layout/Navbar"
    mkdir -p "$COMPONENTS_DIR/frontend/Layout/Footer"
    mkdir -p "$COMPONENTS_DIR/frontend/Layout/Sidebar"
    mkdir -p "$COMPONENTS_DIR/frontend/Layout/Menu"
    
    # Frontend Features
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Blog/Article"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Blog/Feed"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Blog/PostHeader"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Blog/Comments"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Blog/RelatedArticles"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Blog/OtherPosts"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Blog/ShareButtons"
    
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Settings/SettingsTabs"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Settings/Tabs/ProfileTab"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Settings/Tabs/BasicTab"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Settings/Tabs/SecurityTab"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Settings/Tabs/PreferencesTab"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Settings/Tabs/NotificationsTab"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Settings/Tabs/OTPTab"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Settings/styles"
    
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Appointments/AppointmentCalendar"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Knowledge/KnowledgeGraph2D"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Knowledge/KnowledgeGraph3D"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Social/Whatsapp"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Hero/Welcome"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Hero/Services"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Hero/Platforms"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Hero/Projects"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Hero/Testimonials"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Hero/Timeline"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Hero/Toolbox"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Hero/HireMe"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Hero/GitContributions"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Hero/Contact"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/Newsletter"
    mkdir -p "$COMPONENTS_DIR/frontend/Features/CategoryBullets"
    
    # Frontend UI
    mkdir -p "$COMPONENTS_DIR/frontend/UI/Buttons/GeoHeatmapButton"
    mkdir -p "$COMPONENTS_DIR/frontend/UI/Buttons/SystemStatusButton"
    mkdir -p "$COMPONENTS_DIR/frontend/UI/Content/AuthorHeader"
    mkdir -p "$COMPONENTS_DIR/frontend/UI/Content/Newsletter"
    mkdir -p "$COMPONENTS_DIR/frontend/UI/Progress/ReadingProgressBar"
    mkdir -p "$COMPONENTS_DIR/frontend/UI/Effects/SeasonalEffects/SnowFlake"
    
    # Frontend Integrations
    mkdir -p "$COMPONENTS_DIR/frontend/Integrations/Appointments/SSOLogin"
    
    echo -e "${GREEN}✓ New folder structure created${NC}\n"
}

# List files to move (for manual review)
list_moves() {
    echo -e "${BLUE}=== Files to Move (Manual Instructions) ===${NC}\n"
    
    echo -e "${YELLOW}Admin Navbar:${NC}"
    echo "mv $COMPONENTS_DIR/admin/Navbar/* $COMPONENTS_DIR/admin/Layout/Navbar/"
    echo "rmdir $COMPONENTS_DIR/admin/Navbar"
    
    echo -e "\n${YELLOW}Admin Tables:${NC}"
    echo "cp $COMPONENTS_DIR/admin/Tables/* $COMPONENTS_DIR/admin/UI/Tables/"
    echo "rm -rf $COMPONENTS_DIR/admin/Tables"
    
    echo -e "\n${YELLOW}Admin Selects:${NC}"
    echo "cp $COMPONENTS_DIR/admin/Selects/CategorySelect.tsx $COMPONENTS_DIR/admin/UI/Forms/Selects/CategorySelect/"
    echo "cp $COMPONENTS_DIR/admin/Selects/UserSelect.tsx $COMPONENTS_DIR/admin/UI/Forms/Selects/UserSelect/"
    echo "rm -rf $COMPONENTS_DIR/admin/Selects"
    
    echo -e "\n${YELLOW}Admin Editor:${NC}"
    echo "mv $COMPONENTS_DIR/admin/Editor/* $COMPONENTS_DIR/admin/UI/Forms/Editor/"
    echo "rmdir $COMPONENTS_DIR/admin/Editor"
    
    echo -e "\n${YELLOW}Admin Feature Moves:${NC}"
    echo "mv $COMPONENTS_DIR/admin/AIPrompt/* $COMPONENTS_DIR/admin/Features/AIPrompt/"
    echo "mv $COMPONENTS_DIR/admin/SlotTemplateBuilder/* $COMPONENTS_DIR/admin/Features/SlotManagement/SlotTemplateBuilder/"
    echo "mv $COMPONENTS_DIR/admin/SlotsEditor/* $COMPONENTS_DIR/admin/Features/SlotManagement/SlotsEditor/"
    echo "mv $COMPONENTS_DIR/admin/StatsSection/* $COMPONENTS_DIR/admin/Features/StatsSection/"
    
    echo -e "\n${YELLOW}Frontend Layout:${NC}"
    echo "mv $COMPONENTS_DIR/frontend/Navbar/* $COMPONENTS_DIR/frontend/Layout/Navbar/"
    echo "mv $COMPONENTS_DIR/frontend/Footer/* $COMPONENTS_DIR/frontend/Layout/Footer/"
    echo "mv $COMPONENTS_DIR/frontend/Sidebar/* $COMPONENTS_DIR/frontend/Layout/Sidebar/"
    echo "mv $COMPONENTS_DIR/frontend/Menu/* $COMPONENTS_DIR/frontend/Layout/Menu/"
    
    echo -e "\n${YELLOW}Frontend Blog:${NC}"
    echo "mv $COMPONENTS_DIR/frontend/Article/* $COMPONENTS_DIR/frontend/Features/Blog/Article/"
    echo "mv $COMPONENTS_DIR/frontend/Feed/* $COMPONENTS_DIR/frontend/Features/Blog/Feed/"
    echo "mv $COMPONENTS_DIR/frontend/PostHeader/* $COMPONENTS_DIR/frontend/Features/Blog/PostHeader/"
    echo "mv $COMPONENTS_DIR/frontend/Comments/* $COMPONENTS_DIR/frontend/Features/Blog/Comments/"
    echo "mv $COMPONENTS_DIR/frontend/RelatedArticles/* $COMPONENTS_DIR/frontend/Features/Blog/RelatedArticles/"
    echo "mv $COMPONENTS_DIR/frontend/OtherPosts/* $COMPONENTS_DIR/frontend/Features/Blog/OtherPosts/"
    echo "mv $COMPONENTS_DIR/frontend/ShareButtons/* $COMPONENTS_DIR/frontend/Features/Blog/ShareButtons/"
    
    echo -e "\n${YELLOW}Frontend Settings:${NC}"
    echo "# Convert .tsx files to folders with index.tsx"
    echo "mkdir -p $COMPONENTS_DIR/frontend/Features/Settings/Tabs/BasicTab"
    echo "mkdir -p $COMPONENTS_DIR/frontend/Features/Settings/Tabs/SecurityTab"
    echo "mkdir -p $COMPONENTS_DIR/frontend/Features/Settings/Tabs/PreferencesTab"
    echo "mkdir -p $COMPONENTS_DIR/frontend/Features/Settings/Tabs/NotificationsTab"
    echo "mv $COMPONENTS_DIR/frontend/Settings/SettingsTabs.tsx $COMPONENTS_DIR/frontend/Features/Settings/SettingsTabs/index.tsx"
    echo "mv $COMPONENTS_DIR/frontend/Settings/BasicTab.tsx $COMPONENTS_DIR/frontend/Features/Settings/Tabs/BasicTab/index.tsx"
    echo "mv $COMPONENTS_DIR/frontend/Settings/SecurityTab.tsx $COMPONENTS_DIR/frontend/Features/Settings/Tabs/SecurityTab/index.tsx"
    echo "mv $COMPONENTS_DIR/frontend/Settings/PreferencesTab.tsx $COMPONENTS_DIR/frontend/Features/Settings/Tabs/PreferencesTab/index.tsx"
    echo "mv $COMPONENTS_DIR/frontend/Settings/NotificationsTab.tsx $COMPONENTS_DIR/frontend/Features/Settings/Tabs/NotificationsTab/index.tsx"
    echo "mv $COMPONENTS_DIR/frontend/Settings/OTPTab/* $COMPONENTS_DIR/frontend/Features/Settings/Tabs/OTPTab/"
    echo "mv $COMPONENTS_DIR/frontend/Settings/ProfileTab/* $COMPONENTS_DIR/frontend/Features/Settings/Tabs/ProfileTab/"
    echo "mv $COMPONENTS_DIR/frontend/Settings/styles/* $COMPONENTS_DIR/frontend/Features/Settings/styles/"
    
    echo -e "\n${YELLOW}Frontend Features:${NC}"
    echo "mv $COMPONENTS_DIR/frontend/AppointmentCalendar/* $COMPONENTS_DIR/frontend/Features/Appointments/AppointmentCalendar/"
    echo "mv $COMPONENTS_DIR/frontend/KnowledgeGraph2D/* $COMPONENTS_DIR/frontend/Features/Knowledge/KnowledgeGraph2D/"
    echo "mv $COMPONENTS_DIR/frontend/KnowledgeGraph3D/* $COMPONENTS_DIR/frontend/Features/Knowledge/KnowledgeGraph3D/"
    echo "mv $COMPONENTS_DIR/frontend/Whatsapp/* $COMPONENTS_DIR/frontend/Features/Social/Whatsapp/"
    echo "mv $COMPONENTS_DIR/frontend/Newsletter/* $COMPONENTS_DIR/frontend/Features/Newsletter/"
    echo "mv $COMPONENTS_DIR/frontend/CategoryBullets/* $COMPONENTS_DIR/frontend/Features/CategoryBullets/"
    
    echo -e "\n${YELLOW}Frontend Buttons:${NC}"
    echo "mv $COMPONENTS_DIR/frontend/GeoHeatmapButton/* $COMPONENTS_DIR/frontend/UI/Buttons/GeoHeatmapButton/"
    echo "mv $COMPONENTS_DIR/frontend/SystemStatusButton/* $COMPONENTS_DIR/frontend/UI/Buttons/SystemStatusButton/"
    echo "mkdir -p $COMPONENTS_DIR/frontend/UI/Buttons/ScrollToTop"
    echo "mv $COMPONENTS_DIR/frontend/ScrollToTop/* $COMPONENTS_DIR/frontend/UI/Buttons/ScrollToTop/"
    echo "mkdir -p $COMPONENTS_DIR/frontend/UI/Buttons/TerminalButton"
    echo "mv $COMPONENTS_DIR/frontend/TerminalButton/* $COMPONENTS_DIR/frontend/UI/Buttons/TerminalButton/"
    
    echo -e "\n${YELLOW}Frontend Other:${NC}"
    echo "mv $COMPONENTS_DIR/frontend/AuthorHeader/* $COMPONENTS_DIR/frontend/UI/Content/AuthorHeader/"
    echo "mv $COMPONENTS_DIR/frontend/LoadingElement/* $COMPONENTS_DIR/frontend/UI/Content/"
    echo "mkdir -p $COMPONENTS_DIR/frontend/UI/Content/ReadingProgressBar"
    echo "mv $COMPONENTS_DIR/frontend/ReadingProgressBar/* $COMPONENTS_DIR/frontend/UI/Progress/ReadingProgressBar/"
    echo "mv $COMPONENTS_DIR/frontend/SeasonalEffects/SnowFlake/* $COMPONENTS_DIR/frontend/UI/Effects/SeasonalEffects/SnowFlake/"
    echo "mv $COMPONENTS_DIR/frontend/OfflineIndicator/* $COMPONENTS_DIR/common/UI/Indicators/"
    
    echo -e "\n${YELLOW}Common:${NC}"
    echo "mv $COMPONENTS_DIR/common/Modal/* $COMPONENTS_DIR/common/Layout/Modal/"
    echo "mv $COMPONENTS_DIR/common/Loading/* $COMPONENTS_DIR/common/Layout/Loading/"
    echo "mv $COMPONENTS_DIR/common/Logo/* $COMPONENTS_DIR/common/Layout/Logo/"
    echo "mv $COMPONENTS_DIR/common/ImageLoad/* $COMPONENTS_DIR/common/UI/Images/ImageLoad/"
    echo "mv $COMPONENTS_DIR/common/NavbarAuthButton/* $COMPONENTS_DIR/common/UI/Navigation/"
    
    echo -e "\n${YELLOW}Frontend Integrations:${NC}"
    echo "mv $COMPONENTS_DIR/frontend/AppointmentCalendar/SSOLogin/* $COMPONENTS_DIR/frontend/Integrations/Appointments/SSOLogin/"
    
    echo -e "\n${YELLOW}Clean up old folders:${NC}"
    echo "rmdir $COMPONENTS_DIR/frontend/{Article,Feed,PostHeader,Comments,RelatedArticles,OtherPosts,ShareButtons}"
    echo "rmdir $COMPONENTS_DIR/frontend/{Navbar,Footer,Sidebar,Menu}"
    echo "rmdir $COMPONENTS_DIR/frontend/{GeoHeatmapButton,SystemStatusButton,ScrollToTop,TerminalButton}"
    echo "rmdir $COMPONENTS_DIR/frontend/{AuthorHeader,AppointmentCalendar,KnowledgeGraph2D,KnowledgeGraph3D,Whatsapp,Newsletter,CategoryBullets,LoadingElement,ReadingProgressBar}"
    echo "rmdir $COMPONENTS_DIR/frontend/SeasonalEffects/SnowFlake"
    echo "rmdir $COMPONENTS_DIR/frontend/Settings"
    echo "rmdir $COMPONENTS_DIR/common/{Modal,Loading,Logo,ImageLoad,NavbarAuthButton}"
}

# Run functions
create_structure
list_moves

echo -e "\n${BLUE}=== Next Steps ===${NC}"
echo "1. Review the instructions above carefully"
echo "2. Make sure all imports are updated in your codebase"
echo "3. Run: npm run build or yarn build to verify no import errors"
echo "4. Commit changes to git"
echo -e "\n${GREEN}For automated moving, you can use:${NC}"
echo "bash /home/kuray/KurayDevV2/reorganize-components.sh (once created)"
