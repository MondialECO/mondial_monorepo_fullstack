'use client';

interface RevenueChartProps {
  revenues: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
}

export function RevenueChart({ revenues }: RevenueChartProps) {
  const values = [revenues.q1, revenues.q2, revenues.q3, revenues.q4];
  const maxValue = Math.max(...values, 1);
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  // Calculate bar heights as percentages
  const getBarHeight = (value: number) => {
    return (value / maxValue) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Bars Container */}
      <div className="flex items-end justify-between h-[268px] gap-4 px-2 py-4">
        {values.map((value, index) => {
          const height = getBarHeight(value);
          return (
            <div
              key={quarters[index]}
              className="flex-1 flex flex-col items-center justify-end"
            >
              <div className="w-full relative h-full flex items-end justify-center">
                {/* Background bar */}
                <div
                  className="w-full bg-[#e9f1fa] rounded-[4px]"
                  style={{ height: '100%' }}
                />
                {/* Foreground gradient bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-[4px]"
                  style={{
                    height: `${height}%`,
                    background: 'linear-gradient(180deg, #3388FF 7.88%, #FFFFFF 99.85%)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quarter Labels */}
      <div className="flex justify-between text-sm font-medium text-neutral-1">
        {quarters.map((quarter) => (
          <div key={quarter} className="flex-1 text-center">
            {quarter}
          </div>
        ))}
      </div>
    </div>
  );
}
