'use client';

import { Box, Flex } from '@chakra-ui/react';
import { colors } from '@/theme/colors';
import { spacing, containers } from '@/theme/tokens';
import Navigation, { NavigationSection } from './Navigation';
import MonitoringSidebar from './MonitoringSidebar';
import Footer from './Footer';

interface AppLayoutProps {
  children: React.ReactNode;
  activeSection: NavigationSection;
  activeMonitoringTab?: string;
  onSectionChange: (section: NavigationSection) => void;
  onMonitoringTabChange?: (tab: string) => void;
  hasData: boolean;
}

export default function AppLayout({
  children,
  activeSection,
  activeMonitoringTab = 'load',
  onSectionChange,
  onMonitoringTabChange = () => {},
  hasData
}: AppLayoutProps) {

  const showSidebar = activeSection === 'monitoring';

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg={colors.background}>

      {/* Top Navigation - ALWAYS VISIBLE */}
      <Navigation
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />

      {/* Main Content Area */}
      <Flex flex="1" position="relative" justify="center">

        {/* Conditional Sidebar - ONLY in Monitoring section */}
        {showSidebar && (
          <MonitoringSidebar
            activeTab={activeMonitoringTab}
            onTabChange={onMonitoringTabChange}
            hasData={hasData}
          />
        )}

        {/* Main Content */}
        <Box
          as="main"
          w="100%"
          maxW={containers.content}
          ml={{ base: '0', md: showSidebar ? '240px' : '0' }}
          transition="margin-left 0.3s"
          px={spacing.xl}
          py={spacing['2xl']}
        >
          {children}
        </Box>

      </Flex>

      {/* Footer */}
      <Footer />
    </Box>
  );
}
