import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";

// Split into its own chunk so recharts stays out of the main bundle.
export default function SkillRadar({ data, dark, accent, textDim }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'} />
        <PolarAngleAxis dataKey="skill" tick={{ fill: textDim, fontSize: 11, fontFamily: "'Space Mono',monospace" }} />
        <Radar dataKey="val" stroke={accent} fill={accent} fillOpacity={0.15} strokeWidth={2} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
