import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { fontFamily, fontSize, getColors, getHighlightedParts } from '../tokens';
import BlinkCursor from './BlinkCursor';

const renderTypewrittenArray = (displayedText, fullText, template, highlightStyle) => {
  if (!template || !template.includes('_____')) {
    return [displayedText];
  }
  const parts = getHighlightedParts(fullText, template);
  let currentLen = 0;
  const targetLen = displayedText.length;
  const rendered = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const partText = part.text;
    const remainingToRender = targetLen - currentLen;
    if (remainingToRender <= 0) break;

    if (remainingToRender >= partText.length) {
      rendered.push(
        <Text key={i} style={part.filled ? highlightStyle : undefined}>
          {partText}
        </Text>
      );
      currentLen += partText.length;
    } else {
      rendered.push(
        <Text key={i} style={part.filled ? highlightStyle : undefined}>
          {partText.substring(0, remainingToRender)}
        </Text>
      );
      currentLen += remainingToRender;
      break;
    }
  }
  return rendered;
};

const TerminalTypewriter = ({ text = '', template = null, speed = 25, onComplete, style, textStyle, highlightStyle }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const textRef = useRef(text);
  const timerRef = useRef(null);

  // Sync if text changes
  useEffect(() => {
    setDisplayedText('');
    setIsComplete(false);
    indexRef.current = 0;
    textRef.current = text;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (!text) {
      setIsComplete(true);
      if (onComplete) onComplete();
      return;
    }

    timerRef.current = setInterval(() => {
      const idx = indexRef.current;
      const fullText = textRef.current;
      
      if (idx < fullText.length) {
        setDisplayedText(prev => prev + fullText.charAt(idx));
        indexRef.current = idx + 1;
      } else {
        clearInterval(timerRef.current);
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed]);

  const handlePress = () => {
    if (isComplete) return;
    // Skip animation
    if (timerRef.current) clearInterval(timerRef.current);
    setDisplayedText(text);
    setIsComplete(true);
    if (onComplete) onComplete();
  };

  const c = getColors();
  const defaultHighlightStyle = {
    color: c.accentYellow || '#FFFF00',
    fontWeight: '700',
    textDecorationLine: 'underline',
  };
  const activeHighlightStyle = highlightStyle || defaultHighlightStyle;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={handlePress} style={style}>
      <Text style={[styles.text, { color: c.textPrimary || '#00FF41' }, textStyle]}>
        {template ? renderTypewrittenArray(displayedText, text, template, activeHighlightStyle) : displayedText}
        {!isComplete && <BlinkCursor />}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.body,
    lineHeight: fontSize.body * 1.5,
    textAlign: 'right',
  },
});

export default TerminalTypewriter;
