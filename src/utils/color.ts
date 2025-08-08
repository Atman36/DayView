
/**
 * Checks if a hex color is dark.
 * @param color - Hex color string (e.g., #RRGGBB).
 * @returns True if the color is dark, false otherwise.
 */
export const isDarkColor = (color: string): boolean => {
  if (!color.startsWith('#')) return false; // Handle invalid format

  const hex = color.replace('#', '');
  if (hex.length !== 6) return false; // Handle invalid length

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Formula for perceived brightness (adjust weights as needed)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness < 128; // Threshold for darkness (0-255 range)
};

/**
 * Converts time string (HH:MM) to an angle (0-360 degrees) on a 24-hour clock face.
 * 00:00 (midnight) is at the top (0 degrees), 06:00 is 90 degrees, 12:00 is 180 degrees, 18:00 is 270 degrees.
 * @param time - Time string in "HH:MM" format.
 * @returns Angle in degrees (0-360).
 */
export const timeToAngle = (time: string): number => {
   const [hour, minute] = time.split(':').map(Number);

   // Calculate the total minutes past midnight
   const totalMinutes = hour * 60 + minute;

   // Calculate the angle: (totalMinutes / total minutes in 24 hours) * 360 degrees
   // 24 hours * 60 minutes/hour = 1440 minutes
   let angle = (totalMinutes / 1440) * 360;

   // Adjust angle so that 00:00 is at the top (0 degrees)
   // The calculation naturally places 00:00 at 0 degrees.
   // We need to rotate the coordinate system by -90 degrees conceptually if we want 00:00 at the top.
   // However, SVG rotation handles this, so we keep the raw angle.
    // Ensure angle is within 0-360 range
   angle = (angle + 360) % 360;


   return angle;
};


/**
 * Converts time string (HH:MM) to an angle (0-360 degrees) on a 12-hour clock face.
 * 12 o'clock (00:00 or 12:00) is at the top (0 degrees), 3 o'clock (03:00 or 15:00) is 90 degrees, etc.
 * @param time - Time string in "HH:MM" format (24-hour).
 * @returns Angle in degrees (0-360).
 */
export const timeToAngle12 = (time: string): number => {
   const [hour, minute] = time.split(':').map(Number);

   // Convert hour to 12-hour format for angle calculation (handle 12 AM/PM correctly)
   const hour12 = hour % 12 === 0 ? 12 : hour % 12; // 0 becomes 12 for calculation, 13 becomes 1, etc.

   // Calculate the total minutes past 12:00 within a 12-hour cycle
   // Treat 12:xx as 0:xx for calculation purposes (0 minutes past the hour mark on the 12-hour dial)
   const hourForCalc = hour12 === 12 ? 0 : hour12;
   const totalMinutesIn12HourCycle = hourForCalc * 60 + minute;

   // Calculate the angle: (totalMinutes / total minutes in 12 hours) * 360 degrees
   // 12 hours * 60 minutes/hour = 720 minutes
   let angle = (totalMinutesIn12HourCycle / 720) * 360;

   // Ensure angle is within 0-360 range
   angle = (angle + 360) % 360;

   return angle;
};


/**
 * Generates the SVG path data for a circular segment (annular sector).
 * @param cx - Center x-coordinate.
 * @param cy - Center y-coordinate.
 * @param rInner - Inner radius.
 * @param rOuter - Outer radius.
 * @param startAngle - Start angle in degrees (0 at top, clockwise).
 * @param endAngle - End angle in degrees.
 * @returns SVG path string.
 */
export const getSegmentPath = (
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number
): string => {
   // Handle the case where the angle wraps around 360 degrees
   let deltaAngle = endAngle - startAngle;
   if (deltaAngle <= 0) { // Handles same start/end or wrap-around
     deltaAngle += 360; // Make delta positive
   }
    // Handle floating point inaccuracies near 360 and very small angles
   if (Math.abs(deltaAngle - 360) < 0.01) {
       deltaAngle = 360;
       endAngle = startAngle + 359.99; // Use slightly less than 360 for SVG arc
   } else if (deltaAngle < 0.01) {
        // Don't draw segments that are essentially zero length
       return '';
   }


  const startAngleRad = ((startAngle - 90) * Math.PI) / 180;
  const endAngleRad = ((endAngle - 90) * Math.PI) / 180;

  const x1Outer = cx + rOuter * Math.cos(startAngleRad);
  const y1Outer = cy + rOuter * Math.sin(startAngleRad);
  const x2Outer = cx + rOuter * Math.cos(endAngleRad);
  const y2Outer = cy + rOuter * Math.sin(endAngleRad);

  const x1Inner = cx + rInner * Math.cos(startAngleRad);
  const y1Inner = cy + rInner * Math.sin(startAngleRad);
  const x2Inner = cx + rInner * Math.cos(endAngleRad);
  const y2Inner = cy + rInner * Math.sin(endAngleRad);

   const largeArcFlag = deltaAngle > 180 ? '1' : '0';

  const path = [
    `M ${x1Outer} ${y1Outer}`, // Move to outer start point
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`, // Outer arc
    `L ${x2Inner} ${y2Inner}`, // Line to inner end point
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner}`, // Inner arc (reverse direction)
    'Z', // Close path
  ].join(' ');

  return path;
};
