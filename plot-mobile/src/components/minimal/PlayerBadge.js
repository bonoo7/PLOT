import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { theme } from '../../styles/theme';
import { spacing, fonts, borderRadius } from '../../styles/responsive';

/**
 * PlayerBadge - A reusable component for displaying player names.
 * Style: Bureaucratic/File Folder Tab/Name Tag
 */
export const PlayerBadge = ({ 
  name, 
  role, // Optional: role name or icon
  score, // Optional: score
  isSelf = false, 
  isActive = false, // e.g. speaking
  isEliminated = false,
  size = 'medium', // small, medium, large
  style
}) => {
  const getBackgroundColor = () => {
    if (isEliminated) return '#888';
    if (isActive) return theme.colors.stickyNote; // Active/Speaking = Yellow Note
    if (isSelf) return theme.colors.paper; // Self = Paper
    return 'rgba(255, 255, 255, 0.8)'; // Default
  };

  const getBorderColor = () => {
    if (isActive) return theme.colors.primary;
    if (isSelf) return theme.colors.text;
    return 'rgba(0,0,0,0.1)';
  };

  const containerStyle = {
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    borderWidth: isActive || isSelf ? 2 : 1,
    paddingVertical: size === 'small' ? 4 : size === 'large' ? 12 : 8,
    paddingHorizontal: size === 'small' ? 8 : size === 'large' ? 16 : 12,
    borderRadius: borderRadius.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: size === 'small' ? 80 : 120,
    opacity: isEliminated ? 0.6 : 1,
    ...style
  };

  const textStyle = {
    fontFamily: theme.fonts.main,
    fontSize: size === 'small' ? fonts.tiny : size === 'large' ? fonts.medium : fonts.small,
    color: theme.colors.text,
    fontWeight: isSelf || isActive ? 'bold' : 'normal',
    textAlign: 'left' // RTL handled by parent or GlobalRTL
  };

  return (
    <View style={containerStyle}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
        <Text style={textStyle} numberOfLines={1}>
          {name}
        </Text>
        {role && <Text style={{fontSize: 10, color: '#666'}}>({role})</Text>}
      </View>
      
      {score !== undefined && (
         <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{score}</Text>
         </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scoreBadge: {
    backgroundColor: theme.colors.text,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8
  },
  scoreText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold
  }
});

export default PlayerBadge;
