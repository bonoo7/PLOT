import { useWindowDimensions, Platform } from 'react-native';

/**
 * Hook to determine if the current layout should be desktop/web optimized
 * Replaces the repeated check: Platform.OS === 'web' && Dimensions.get('window').width >= 768
 * 
 * @returns {Object} { isDesktop, width, height, isWeb }
 */
export const useResponsiveLayout = () => {
  const { width, height } = useWindowDimensions();
  
  const isWeb = Platform.OS === 'web';
  const isDesktop = isWeb && width >= 768;
  
  return {
    isDesktop,
    isWeb,
    width,
    height
  };
};
