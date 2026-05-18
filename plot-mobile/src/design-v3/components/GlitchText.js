import React, { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';

const SYMBOLS = '!@#$%^&*░▒▓█';
const INTERVALS = { low: 5000, med: 2000, high: 800 };

const glitchText = (text) => {
  const indices = text
    .split('')
    .map((char, index) => (char.trim() ? index : null))
    .filter((value) => value !== null);

  if (!indices.length) return text;

  const count = Math.min(indices.length, 1 + Math.floor(Math.random() * 2));
  const pool = [...indices].sort(() => Math.random() - 0.5).slice(0, count);
  const chars = text.split('');

  pool.forEach((index) => {
    chars[index] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  });

  return chars.join('');
};

const GlitchText = ({ text = '', style, glitch = false, intensity = 'low', children, ...rest }) => {
  const source = useMemo(() => `${text}${children && typeof children === 'string' ? children : ''}`, [children, text]);
  const [display, setDisplay] = useState(source);

  useEffect(() => {
    setDisplay(source);
  }, [source]);

  useEffect(() => {
    if (!glitch || !source) return undefined;

    const interval = setInterval(() => {
      setDisplay(glitchText(source));
      setTimeout(() => setDisplay(source), 150);
    }, INTERVALS[intensity] || INTERVALS.low);

    return () => clearInterval(interval);
  }, [glitch, intensity, source]);

  return (
    <Text {...rest} style={style}>
      {display}
    </Text>
  );
};

export default GlitchText;
