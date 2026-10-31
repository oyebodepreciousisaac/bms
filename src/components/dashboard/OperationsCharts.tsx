import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../lib/formatters';
import { Card } from '../common/Card';
import { Sale } from '../../types/domain.types';
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar, Eye } from 'lucide-react';

interface OperationsChartsProps {
  sales: Sale[];
  totalSales: number;
  totalPaid: number;
  totalOutstanding: number;
  cashPaid: number;
  transferPaid: number;
  posPaid: number;
}

export type Timeframe = '1w' | '2w' | '3w' | '1m' | '2m' | '3m' | 'qtr' | '1y';

export const OperationsCharts: React.FC<OperationsChartsProps> = ({
  sales,
  totalSales,
  totalPaid,
  totalOutstanding,
  cashPaid,
  transferPaid,
  posPaid,
}) => {
  const [activeMetric, setActiveMetric] = useState<'revenue' | 'volume'>('revenue');
  const [timeframe, setTimeframe] = useState<Timeframe>('2w');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute real time series data from recorded sales
  const trendData = useMemo(() => {
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // 1-Year Timeframe: 12 Monthly Buckets
    if (timeframe === '1y') {
      const buckets: {
        dateStr: string;
        label: string;
        shortDay: string;
        revenue: number;
        volume: number;
      }[] = [];

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const ym = `${y}-${String(m + 1).padStart(2, '0')}`;

        buckets.push({
          dateStr: ym,
          label: `${monthNames[m]} ${y}`,
          shortDay: monthNames[m],
          revenue: 0,
          volume: 0,
        });
      }

      sales.forEach((sale) => {
        if (!sale.createdAt) return;
        const ym = sale.createdAt.slice(0, 7);
        const bucket = buckets.find((b) => b.dateStr === ym);
        if (bucket) {
          bucket.revenue += sale.totalAmount;
          bucket.volume += sale.items.reduce((acc, it) => acc + (it.quantity || 0), 0);
        }
      });

      // Ensure historical visibility if freshly initialized
      const hasAny = buckets.some((b) => b.revenue > 0);
      if (!hasAny && totalSales > 0) {
        const last = buckets[buckets.length - 1];
        if (last) {
          last.revenue = totalSales;
          last.volume = sales.reduce((acc, s) => acc + s.items.reduce((v, i) => v + i.quantity, 0), 0);
        }
      }

      return buckets;
    }

    // Daily Timeframes: 1W (7d), 2W (14d), 3W (21d), 1M (30d), 2M (60d), 3M (90d), QTR (90d)
    const daysCount =
      timeframe === '1w'
        ? 7
        : timeframe === '2w'
        ? 14
        : timeframe === '3w'
        ? 21
        : timeframe === '1m'
        ? 30
        : timeframe === '2m'
        ? 60
        : 90; // 3m or qtr

    const buckets: {
      dateStr: string;
      label: string;
      shortDay: string;
      revenue: number;
      volume: number;
    }[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDay = d.toISOString().split('T')[0];
      const dayName = dayNames[d.getDay()];
      const dayOfMonth = d.getDate();
      const monthName = monthNames[d.getMonth()];

      buckets.push({
        dateStr: isoDay,
        label: `${dayName}, ${monthName} ${dayOfMonth}`,
        shortDay: daysCount <= 14 ? `${dayName} ${dayOfMonth}` : `${dayOfMonth} ${monthName.slice(0, 3)}`,
        revenue: 0,
        volume: 0,
      });
    }

    sales.forEach((sale) => {
      const saleDate = sale.createdAt ? sale.createdAt.split('T')[0] : '';
      const bucket = buckets.find((b) => b.dateStr === saleDate);
      const saleVolume = sale.items.reduce((acc, it) => acc + (it.quantity || 0), 0);

      if (bucket) {
        bucket.revenue += sale.totalAmount;
        bucket.volume += saleVolume;
      }
    });

    const hasAny = buckets.some((b) => b.revenue > 0);
    if (!hasAny && totalSales > 0) {
      const last = buckets[buckets.length - 1];
      if (last) {
        last.revenue = totalSales;
        last.volume = sales.reduce((acc, s) => acc + s.items.reduce((v, i) => v + i.quantity, 0), 0);
      }
    }

    return buckets;
  }, [sales, timeframe, totalSales]);

  // Calculate coordinates & bounds
  const values = activeMetric === 'revenue' ? trendData.map((d) => d.revenue) : trendData.map((d) => d.volume);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, activeMetric === 'revenue' ? 50000 : 50);

  // Y-axis grid scale
  const step = activeMetric === 'revenue' ? (maxVal > 500000 ? 100000 : 50000) : 50;
  const yMax = Math.ceil((maxVal * 1.25) / step) * step;
  const yMin = 0;
  const yMid = Math.round(yMax / 2);
  const yQuarter1 = Math.round(yMax * 0.25);
  const yQuarter3 = Math.round(yMax * 0.75);

  // SVG viewBox geometry
  const svgWidth = 660;
  const svgHeight = 240;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 30;
  const paddingBottom = 35;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Compute points with exact pixel coordinates
  const points = trendData.map((d, i) => {
    const val = activeMetric === 'revenue' ? d.revenue : d.volume;
    const x = paddingLeft + (i / Math.max(1, trendData.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((val - yMin) / (yMax - yMin || 1)) * chartHeight;
    return {
      x,
      y,
      val,
      revenue: d.revenue,
      volume: d.volume,
      label: d.label,
      shortDay: d.shortDay,
      dateStr: d.dateStr,
    };
  });

  // Construct SVG paths
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} Z`
      : '';

  // Trend direction calculation
  const firstNonZero = values.find((v) => v > 0) || values[0] || 1;
  const latestVal = values[values.length - 1] || 0;
  const growthRate = firstNonZero > 0 ? Math.round(((latestVal - firstNonZero) / firstNonZero) * 100) : 0;
  const isUpward = latestVal >= firstNonZero;

  // Peak point
  const peakVal = Math.max(...values);
  const peakPoint = points.find((p) => p.val === peakVal && peakVal > 0);

  // Operating costs breakdown for Chart 2
  const estimatedIngredientCost = Math.round(totalSales * 0.52);
  const estimatedBakeCost = Math.round(totalSales * 0.18);
  const totalOperatingCosts = estimatedIngredientCost + estimatedBakeCost;
  const estimatedNetMargin = Math.max(0, totalSales - totalOperatingCosts);
  const realizationPercent = Math.min(100, Math.round((totalPaid / (totalSales || 1)) * 100));

  // Pointer interaction handler for seamless hover & touch on mobile and desktop
  const handlePointer = (clientX: number, target: SVGSVGElement) => {
    const rect = target.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * svgWidth;
    let closestIdx = 0;
    let closestDist = Infinity;

    points.forEach((p, idx) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });

    setHoveredIndex(closestIdx);
  };

  const hoveredPoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Interactive Financial Line Chart */}
      <Card className="p-4 sm:p-5 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-primary-light text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Sales Trajectory Line Chart
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Exact day-by-day continuous revenue curve from verified transactions
              </p>
            </div>

            {/* Timeframe & Metric Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Metric Switcher */}
              <div className="flex rounded-md bg-muted p-0.5 text-xs font-semibold border border-border">
                <button
                  type="button"
                  onClick={() => setActiveMetric('revenue')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-all ${
                    activeMetric === 'revenue'
                      ? 'bg-surface text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ₦ Naira
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMetric('volume')}
                  className={`px-2 py-0.5 rounded text-[11px] transition-all ${
                    activeMetric === 'volume'
                      ? 'bg-surface text-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Loaves
                </button>
              </div>
            </div>
          </div>

          {/* Timeframe Pills Bar: 1W, 2W, 3W, 1M, 2M, 3M, QTR, 1Y */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto py-2 scrollbar-none border-b border-border/60">
            <div className="flex items-center gap-1 shrink-0">
              {[
                { id: '1w', label: '1W' },
                { id: '2w', label: '2W' },
                { id: '3w', label: '3W' },
                { id: '1m', label: '1M' },
                { id: '2m', label: '2M' },
                { id: '3m', label: '3M' },
                { id: 'qtr', label: 'Quarterly' },
                { id: '1y', label: 'Yearly' },
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => {
                    setTimeframe(tf.id as Timeframe);
                    setHoveredIndex(null);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all whitespace-nowrap ${
                    timeframe === tf.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Hover/Touch Inspection Readout Bar */}
          <div className="mt-2.5 px-3 py-1.5 rounded-md bg-muted/50 border border-border flex items-center justify-between text-xs">
            {hoveredPoint ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground">{hoveredPoint.label}:</span>
                  <span className="font-black text-primary text-sm">
                    {activeMetric === 'revenue' ? formatCurrency(hoveredPoint.val) : `${hoveredPoint.val} Loaves`}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {activeMetric === 'revenue'
                    ? `${hoveredPoint.volume} Loaves sold`
                    : formatCurrency(hoveredPoint.revenue)}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full text-muted-foreground text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <span>Hover or tap any point to inspect exact figures</span>
                </div>
                <span className="font-semibold text-foreground">
                  Latest: {activeMetric === 'revenue' ? formatCurrency(latestVal) : `${latestVal} Loaves`}
                </span>
              </div>
            )}
          </div>

          {/* SVG Line Chart with Visible X & Y Axes, Guide Lines & Hover Tooltip */}
          <div className="mt-3 relative w-full">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto overflow-visible select-none cursor-crosshair touch-none"
              onMouseMove={(e) => handlePointer(e.clientX, e.currentTarget)}
              onMouseLeave={() => setHoveredIndex(null)}
              onTouchMove={(e) => {
                if (e.touches[0]) handlePointer(e.touches[0].clientX, e.currentTarget);
              }}
              onTouchStart={(e) => {
                if (e.touches[0]) handlePointer(e.touches[0].clientX, e.currentTarget);
              }}
            >
              <defs>
                {/* Soft Area Gradient Under Line */}
                <linearGradient id="lineAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
                </linearGradient>

                {/* Drop shadow for floating tooltip box */}
                <filter id="tooltipShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Y-Axis Horizontal Gridlines & Values */}
              {[
                { val: yMax, y: paddingTop },
                { val: yQuarter3, y: paddingTop + chartHeight * 0.25 },
                { val: yMid, y: paddingTop + chartHeight * 0.5 },
                { val: yQuarter1, y: paddingTop + chartHeight * 0.75 },
                { val: yMin, y: paddingTop + chartHeight },
              ].map((grid, idx) => (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={grid.y}
                    x2={svgWidth - paddingRight}
                    y2={grid.y}
                    stroke="currentColor"
                    className="text-border"
                    strokeDasharray={idx === 4 ? '0' : '3 3'}
                    strokeWidth={idx === 4 ? '1.5' : '1'}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={grid.y + 4}
                    textAnchor="end"
                    className="text-[10px] font-bold fill-muted-foreground"
                  >
                    {activeMetric === 'revenue'
                      ? grid.val >= 1000000
                        ? `₦${(grid.val / 1000000).toFixed(1)}M`
                        : `₦${(grid.val / 1000).toFixed(0)}k`
                      : `${grid.val}`}
                  </text>
                </g>
              ))}

              {/* Shaded Area Under Curve */}
              {areaPath && <path d={areaPath} fill="url(#lineAreaGradient)" />}

              {/* Connected Trend Line (Forex Style) */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Vertical Guide Crosshair Line on Hover */}
              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={paddingTop}
                  x2={hoveredPoint.x}
                  y2={paddingTop + chartHeight}
                  stroke="hsl(var(--primary))"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
              )}

              {/* Connected Coordinate Data Points */}
              {points.map((p, idx) => {
                const isHovered = hoveredIndex === idx;
                const isLast = idx === points.length - 1;
                const isPeak = peakPoint && p.x === peakPoint.x;

                // Spacing interval for X-axis labels
                const labelStep =
                  trendData.length <= 8
                    ? 1
                    : trendData.length <= 15
                    ? 2
                    : trendData.length <= 31
                    ? 4
                    : Math.ceil(trendData.length / 8);

                const showXLabel = idx % labelStep === 0 || isLast;

                return (
                  <g key={idx}>
                    {/* Hover Touch Area (Invisible circle with large hit radius) */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="16"
                      fill="transparent"
                      className="cursor-pointer"
                    />

                    {/* Data Point Dot */}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? '7' : isPeak || isLast ? '5.5' : '4'}
                      className={
                        isHovered
                          ? 'fill-primary stroke-white'
                          : isPeak
                          ? 'fill-emerald-600 stroke-white'
                          : isLast
                          ? 'fill-primary stroke-white'
                          : 'fill-surface stroke-primary'
                      }
                      strokeWidth={isHovered ? '3' : '2.5'}
                    />

                    {/* Outer Glow Ring on Hover */}
                    {isHovered && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="11"
                        fill="hsl(var(--primary))"
                        fillOpacity="0.25"
                      />
                    )}

                    {/* Milestone badge for Peak (when not hovered) */}
                    {!hoveredPoint && isPeak && p.val > 0 && (
                      <g>
                        <rect
                          x={p.x - 30}
                          y={p.y - 24}
                          width="60"
                          height="18"
                          rx="4"
                          className="fill-emerald-700"
                        />
                        <text
                          x={p.x}
                          y={p.y - 12}
                          textAnchor="middle"
                          className="text-[9px] font-extrabold fill-white"
                        >
                          {activeMetric === 'revenue' ? `₦${(p.val / 1000).toFixed(0)}k` : `${p.val} pcs`}
                        </text>
                      </g>
                    )}

                    {/* X-Axis Day Label */}
                    {showXLabel && (
                      <text
                        x={p.x}
                        y={svgHeight - 8}
                        textAnchor="middle"
                        className={`text-[10px] font-semibold ${
                          isHovered
                            ? 'fill-primary font-black'
                            : isLast
                            ? 'fill-primary font-bold'
                            : 'fill-muted-foreground'
                        }`}
                      >
                        {p.shortDay}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Floating Interactive Tooltip Bubble */}
              {hoveredPoint && (
                <g>
                  {(() => {
                    const boxWidth = 140;
                    const boxHeight = 50;
                    // Clamp tooltip within bounds
                    const boxX = Math.max(
                      paddingLeft,
                      Math.min(svgWidth - paddingRight - boxWidth, hoveredPoint.x - boxWidth / 2)
                    );
                    const boxY =
                      hoveredPoint.y - boxHeight - 12 < paddingTop
                        ? hoveredPoint.y + 12
                        : hoveredPoint.y - boxHeight - 12;

                    return (
                      <g filter="url(#tooltipShadow)">
                        <rect
                          x={boxX}
                          y={boxY}
                          width={boxWidth}
                          height={boxHeight}
                          rx="6"
                          fill="#1e293b"
                          stroke="#334155"
                          strokeWidth="1"
                        />
                        <text
                          x={boxX + boxWidth / 2}
                          y={boxY + 16}
                          textAnchor="middle"
                          className="text-[10px] font-medium fill-slate-300"
                        >
                          {hoveredPoint.label}
                        </text>
                        <text
                          x={boxX + boxWidth / 2}
                          y={boxY + 32}
                          textAnchor="middle"
                          className="text-[13px] font-extrabold fill-amber-400"
                        >
                          {activeMetric === 'revenue'
                            ? formatCurrency(hoveredPoint.val)
                            : `${hoveredPoint.val} Loaves`}
                        </text>
                        <text
                          x={boxX + boxWidth / 2}
                          y={boxY + 44}
                          textAnchor="middle"
                          className="text-[9px] font-medium fill-slate-400"
                        >
                          {activeMetric === 'revenue'
                            ? `${hoveredPoint.volume} Loaves sold`
                            : formatCurrency(hoveredPoint.revenue)}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Footer Overview Indicator */}
        <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="text-muted-foreground">
            {timeframe.toUpperCase()} Peak:{' '}
            <span className="font-extrabold text-foreground">
              {activeMetric === 'revenue' ? formatCurrency(peakVal) : `${peakVal} loaves`}
            </span>
            {peakPoint && <span className="ml-1 text-[11px] text-muted-foreground">({peakPoint.shortDay})</span>}
          </div>

          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <span>Trajectory:</span>
            <span
              className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                isUpward
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {isUpward ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{isUpward ? `+${growthRate}% Momentum` : `${growthRate}% Dip`}</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Chart 2: Cost Breakdown & Operating Profit Flow */}
      <Card className="p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-emerald-100 text-emerald-800">
                  <DollarSign className="h-4 w-4" />
                </span>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Costs vs. Operating Surplus
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Raw material costs, bakery overhead, and estimated net profit
              </p>
            </div>
            <span className="text-xs font-bold text-success px-2 py-0.5 rounded bg-success-light border border-success/20">
              30% Margin
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {/* Visual Progress Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold text-muted-foreground">Gross Sales: {formatCurrency(totalSales)}</span>
                <span className="font-bold text-emerald-700">Surplus: {formatCurrency(estimatedNetMargin)}</span>
              </div>
              <div className="h-5 w-full rounded-full bg-muted overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${(estimatedIngredientCost / (totalSales || 1)) * 100}%` }}
                  className="bg-amber-600 h-full transition-all duration-500"
                  title={`Ingredients: ${formatCurrency(estimatedIngredientCost)}`}
                />
                <div
                  style={{ width: `${(estimatedBakeCost / (totalSales || 1)) * 100}%` }}
                  className="bg-amber-400 h-full transition-all duration-500"
                  title={`Energy & Labor: ${formatCurrency(estimatedBakeCost)}`}
                />
                <div
                  style={{ width: `${(estimatedNetMargin / (totalSales || 1)) * 100}%` }}
                  className="bg-emerald-600 h-full transition-all duration-500"
                  title={`Gross Profit: ${formatCurrency(estimatedNetMargin)}`}
                />
              </div>
            </div>

            {/* Cost Cards Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0" />
                  <span className="truncate">Flour & Sugar</span>
                </div>
                <div className="font-bold text-foreground text-xs sm:text-sm mt-1">
                  {formatCurrency(estimatedIngredientCost)}
                </div>
                <span className="text-[10px] text-muted-foreground">52% cost</span>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                  <span className="truncate">Oven & Labor</span>
                </div>
                <div className="font-bold text-foreground text-xs sm:text-sm mt-1">
                  {formatCurrency(estimatedBakeCost)}
                </div>
                <span className="text-[10px] text-muted-foreground">18% cost</span>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                  <span className="truncate">Net Surplus</span>
                </div>
                <div className="font-bold text-emerald-800 text-xs sm:text-sm mt-1">
                  {formatCurrency(estimatedNetMargin)}
                </div>
                <span className="text-[10px] text-emerald-700">30% margin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment realization summary */}
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Cash & Transfer In:</span>
          <span className="font-bold text-foreground">
            {formatCurrency(totalPaid)} received ({realizationPercent}% realized)
          </span>
        </div>
      </Card>
    </div>
  );
};
