'use client';

import { Box, Flex, Text } from '@chakra-ui/react';
import {
  LayoutDashboard,
  Monitor,
  FileCheck,
  TrendingUp,
  Settings,
  Bell,
  User,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  transitions,
  zIndex,
} from '@/theme';
import Badge, { CountBadge } from './Badge';

// Navigation sections
type NavigationSection =
  | 'home'
  | 'monitoring'
  | 'compliance'
  | 'analytics'
  | 'settings'
  | 'documentation'; // Legacy support

interface Tab {
  id: NavigationSection;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
}

interface NavigationProps {
  activeSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
  notificationCount?: number;
  userName?: string;
  userAvatar?: string;
}

/**
 * Professional Navigation Bar
 * 80px height, clear active states, notification bell, user section
 */
export default function Navigation({
  activeSection,
  onSectionChange,
  notificationCount = 0,
  userName = 'User',
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs: Tab[] = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoring', icon: Monitor },
    { id: 'compliance', label: 'Compliance', icon: FileCheck, badge: 3 },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  return (
    <Box
      as="nav"
      position="sticky"
      top="0"
      zIndex={zIndex.sticky}
      bg={colors.primary[900]}
      boxShadow={shadows.sm}
    >
      <Box maxW="1400px" mx="auto" px={spacing.lg}>
        <Flex h={spacing.navHeight} align="center" justify="space-between">
          {/* Logo Section */}
          <LogoSection />

          {/* Desktop Navigation */}
          <Flex
            gap={spacing.xs}
            display={{ base: 'none', md: 'flex' }}
            align="center"
          >
            {tabs.map((tab) => (
              <NavTab
                key={tab.id}
                tab={tab}
                isActive={activeSection === tab.id}
                onClick={() => onSectionChange(tab.id)}
              />
            ))}
          </Flex>

          {/* Right Section - User & Notifications */}
          <Flex align="center" gap={spacing.md}>
            {/* Notification Bell */}
            <NotificationBell count={notificationCount} />

            {/* Settings */}
            <NavIconButton
              icon={Settings}
              isActive={activeSection === 'settings'}
              onClick={() => onSectionChange('settings')}
              aria-label="Settings"
            />

            {/* User Avatar */}
            <UserAvatar name={userName} />

            {/* Mobile Menu Toggle */}
            <Box display={{ base: 'flex', md: 'none' }}>
              <NavIconButton
                icon={mobileMenuOpen ? X : Menu}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              />
            </Box>
          </Flex>
        </Flex>
      </Box>

      {/* Mobile Navigation Drawer */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        tabs={tabs}
        activeSection={activeSection}
        onSectionChange={(section) => {
          onSectionChange(section);
          setMobileMenuOpen(false);
        }}
      />
    </Box>
  );
}

/**
 * Logo Section
 */
function LogoSection() {
  return (
    <Flex align="center" gap={spacing.sm}>
      <Flex
        w="40px"
        h="40px"
        borderRadius={borderRadius.md}
        bg={colors.primary[500]}
        align="center"
        justify="center"
      >
        <Text color="white" fontWeight="bold" fontSize="18px">
          C
        </Text>
      </Flex>
      <Flex align="center" gap={spacing.xs}>
        <Text
          fontSize="24px"
          fontWeight={700}
          color={colors.text.inverse}
          letterSpacing="-0.02em"
        >
          CERT
        </Text>
        <Badge variant="pro" size="sm">
          PRO
        </Badge>
      </Flex>
    </Flex>
  );
}

/**
 * Navigation Tab Component
 */
interface NavTabProps {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}

function NavTab({ tab, isActive, onClick }: NavTabProps) {
  const IconComponent = tab.icon;

  return (
    <Box
      as="button"
      onClick={onClick}
      display="flex"
      alignItems="center"
      gap={spacing.xs}
      px={spacing.md}
      py={spacing.sm}
      borderRadius={borderRadius.md}
      fontSize="14px"
      fontWeight={500}
      color={isActive ? colors.text.inverse : colors.neutral[400]}
      bg={isActive ? colors.primary[700] : 'transparent'}
      transition={transitions.all}
      cursor="pointer"
      position="relative"
      _hover={{
        bg: isActive ? colors.primary[700] : 'rgba(255, 255, 255, 0.1)',
        color: colors.text.inverse,
      }}
    >
      <IconComponent size={18} />
      <Text>{tab.label}</Text>
      {tab.badge && tab.badge > 0 && (
        <CountBadge count={tab.badge} variant="warning" size="sm" />
      )}
    </Box>
  );
}

/**
 * Navigation Icon Button
 */
interface NavIconButtonProps {
  icon: typeof Settings;
  isActive?: boolean;
  onClick: () => void;
  'aria-label': string;
}

function NavIconButton({
  icon: Icon,
  isActive = false,
  onClick,
  'aria-label': ariaLabel,
}: NavIconButtonProps) {
  return (
    <Box
      as="button"
      onClick={onClick}
      display="flex"
      alignItems="center"
      justifyContent="center"
      w="40px"
      h="40px"
      borderRadius={borderRadius.md}
      color={isActive ? colors.text.inverse : colors.neutral[400]}
      bg={isActive ? colors.primary[700] : 'transparent'}
      transition={transitions.all}
      cursor="pointer"
      aria-label={ariaLabel}
      _hover={{
        bg: 'rgba(255, 255, 255, 0.1)',
        color: colors.text.inverse,
      }}
    >
      <Icon size={20} />
    </Box>
  );
}

/**
 * Notification Bell with Count
 */
function NotificationBell({ count }: { count: number }) {
  return (
    <Box position="relative">
      <NavIconButton
        icon={Bell}
        onClick={() => {}}
        aria-label={`Notifications${count > 0 ? ` (${count})` : ''}`}
      />
      {count > 0 && (
        <Box
          position="absolute"
          top="-2px"
          right="-2px"
          minW="18px"
          h="18px"
          borderRadius="full"
          bg={colors.accent[500]}
          color={colors.text.inverse}
          fontSize="10px"
          fontWeight={600}
          display="flex"
          alignItems="center"
          justifyContent="center"
          px="4px"
          border={`2px solid ${colors.primary[900]}`}
        >
          {count > 9 ? '9+' : count}
        </Box>
      )}
    </Box>
  );
}

/**
 * User Avatar
 */
function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Flex
      as="button"
      align="center"
      justify="center"
      w="40px"
      h="40px"
      borderRadius="full"
      bg={colors.primary[500]}
      color={colors.text.inverse}
      fontSize="14px"
      fontWeight={600}
      cursor="pointer"
      transition={transitions.all}
      _hover={{
        bg: colors.primary[400],
      }}
    >
      {initials}
    </Flex>
  );
}

/**
 * Mobile Navigation Drawer
 */
interface MobileDrawerProps {
  isOpen: boolean;
  tabs: Tab[];
  activeSection: NavigationSection;
  onSectionChange: (section: NavigationSection) => void;
}

function MobileDrawer({
  isOpen,
  tabs,
  activeSection,
  onSectionChange,
}: MobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <Box
      position="absolute"
      top={spacing.navHeight}
      left="0"
      right="0"
      bg={colors.primary[900]}
      borderTop={`1px solid ${colors.primary[700]}`}
      p={spacing.md}
      display={{ base: 'block', md: 'none' }}
      boxShadow={shadows.elevated}
    >
      <Flex direction="column" gap={spacing.xs}>
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeSection === tab.id;

          return (
            <Box
              key={tab.id}
              as="button"
              onClick={() => onSectionChange(tab.id)}
              display="flex"
              alignItems="center"
              gap={spacing.sm}
              p={spacing.md}
              borderRadius={borderRadius.md}
              fontSize="16px"
              fontWeight={500}
              color={isActive ? colors.text.inverse : colors.neutral[400]}
              bg={isActive ? colors.primary[700] : 'transparent'}
              transition={transitions.all}
              cursor="pointer"
              w="100%"
              textAlign="left"
              _hover={{
                bg: isActive ? colors.primary[700] : 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <IconComponent size={20} />
              <Text flex={1}>{tab.label}</Text>
              {tab.badge && tab.badge > 0 && (
                <CountBadge count={tab.badge} variant="warning" size="sm" />
              )}
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}

// Export navigation section type for external use
export type { NavigationSection };
