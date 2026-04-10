import React from 'react';
import { Box, Tooltip } from '@mui/material';

export type BadgeType = 'admin' | 'customer' | 'provider';

const BadgeSVG = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M12 2l2.5 4.5L19 8l-3.5 2.5L16 15l-4-2-4 2 1.5-4.5L5 8l4.5-1.5L12 2z" fill={color} />
    <path d="M10.5 12.5l1.5 1.5 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const VerificationBadge = ({ type }: { type: BadgeType }) => {
  if (type === 'admin') return (
    <Tooltip title="Admin">
      <Box sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}><BadgeSVG color="#1DA1F2" /></Box>
    </Tooltip>
  );
  if (type === 'customer') return (
    <Tooltip title="Verified Customer">
      <Box sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}><BadgeSVG color="#2176FF" /></Box>
    </Tooltip>
  );
  return (
    <Tooltip title="Verified Provider">
      <Box sx={{ display: 'inline-flex', alignItems: 'center', ml: 0.5 }}><BadgeSVG color="#16A34A" /></Box>
    </Tooltip>
  );
};

export default VerificationBadge;
