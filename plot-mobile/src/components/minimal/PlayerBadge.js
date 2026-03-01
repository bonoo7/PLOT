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
    if (isEliminated) return '#666'; // Dark gray/faded
    if (isActive) return '#D4AF37'; // Dull gold/amber for active speaker
    if (isSelf) return '#D2B48C'; // Tan paper
    return '#EBE1D2'; // Manila paper default
  };

  const getBorderColor = () => {
    if (isActive) return '#8B7355'; // Darker brown
    if (isSelf) return '#5D4037';
    return '#C1A173'; // Manila border
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={textStyle} numberOfLines={1}>
          {name}
        </Text>
        {role && <Text style={{ fontSize: 10, color: '#666' }}>({role})</Text>}
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
    backgroundColor: '#2A2A2A', // Typewriter black
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#000'
  },
  scoreText: {
    color: '#F4E4C1', // Vintage off-white
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold
  }
});

export default PlayerBadge;
