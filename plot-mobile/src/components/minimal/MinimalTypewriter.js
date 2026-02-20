import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../../styles/theme';
import { fonts } from '../../styles/responsive';

/**
 * MinimalTypewriter - Renders text character by character like a typewriter.
 * Ideally, this would play a sound on each character reveal if sound was supported.
 */
const MinimalTypewriter = ({ 
  text, 
  speed = 30, // ms per char
  onComplete,
  style = {},
  ...props
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    // Reset if text changes
    setDisplayedText('');
    indexRef.current = 0;
    
    if (!text) return;
    
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayedText((prev) => text.substring(0, indexRef.current + 1)); // More reliable substring
        indexRef.current += 1;
      } else {
        clearInterval(timerRef.current);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timerRef.current);
  }, [text, speed, onComplete]);

  return (
    <Text style={[styles.text, style]} {...props}>
      {displayedText}<Text style={styles.cursor}>|</Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: theme.fonts.main, // Courier New
    color: theme.colors.text,
    fontSize: fonts.medium,
    lineHeight: 24,
  },
  cursor: {
    color: theme.colors.primary,
    opacity: 0.8,
  }
});

export default MinimalTypewriter;
