import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getTheme } from '../../constants/theme';
import { useGameStore } from '../../store/useGameStore';
import { spacing, fonts, borderRadius } from '../../styles/responsive';
import { Avatar } from '../avatar/Avatar';

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
  style,
  avatar // Optional avatar config
}) => {
  const themeMode = useGameStore(state => state.themeMode);
  const players = useGameStore(state => state.players);
  const t = getTheme(themeMode);

  const playerAvatar = avatar || players.find(p => p.name === name)?.avatar;

  const getBackgroundColor = () => {
    if (isEliminated) return themeMode === 'dark' ? '#333' : '#999';
    if (isActive) return '#D4AF37'; // Dull gold for active speaker
    if (isSelf) return t.inputBg;
    return t.cardBg;
  };

  const getBorderColor = () => {
    if (isActive) return '#8B7355';
    if (isSelf) return t.textMuted;
    return t.cardBorder;
  };

  const getTextColor = () => {
    if (isEliminated) return '#000'; // Make dead players' text dark for readability on gray
    if (isActive) return '#1A1A1A'; // Dark text on gold
    return t.text;
  };

  const containerStyle = {
    backgroundColor: getBackgroundColor(),
    borderColor: getBorderColor(),
    borderWidth: 2, // Cartoonish thick border
    paddingVertical: size === 'small' ? 4 : size === 'large' ? 12 : 8,
    paddingHorizontal: size === 'small' ? 8 : size === 'large' ? 16 : 12,
    borderRadius: borderRadius.small,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: size === 'small' ? 80 : 120,
    opacity: isEliminated ? 0.6 : 1,
    shadowColor: t.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    ...style
  };

  const textStyle = {
    fontFamily: 'Courier', // Typewriter font
    fontWeight: 'bold',
    fontSize: size === 'small' ? fonts.tiny : size === 'large' ? fonts.medium : fonts.small,
    color: getTextColor(),
    textAlign: 'left'
  };

  return (
    <View style={containerStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {playerAvatar && (
          <Avatar
            config={playerAvatar}
            size={size === 'small' ? 24 : size === 'large' ? 40 : 32}
            isSpeaking={isActive}
            disableAnimation={isEliminated}
          />
        )}
        <Text style={textStyle} numberOfLines={1}>
          {name}
        </Text>
        {role && <Text style={{ fontSize: 10, color: t.textMuted }}>({role})</Text>}
      </View>

      {score !== undefined && (
        <View style={[styles.scoreBadge, { backgroundColor: t.text, borderColor: t.background }]}>
          <Text style={[styles.scoreText, { color: t.background }]}>{score}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  scoreBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    borderWidth: 1,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Courier'
  }
});

export default PlayerBadge;
