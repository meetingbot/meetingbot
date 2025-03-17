export interface UsageTooltipProps {
    active?: boolean;
    payload?: {payload: any}[];
    label?: string;
    metric: string
}

export const UsageTooltip = ({ active, payload, label, metric }: UsageTooltipProps) => {
    if (!active || !payload || !payload.length) return null;
    const objData = payload[0]?.payload;
    if (!objData) return null;

    // Render
    const activeMutation = 'font-semibold text-lg'
    const checkActive = (check: string) => (metric === check ? activeMutation : '');
 
    // Format
    const formatDuration = (ms: number): string => {
      if (ms < 1000) return `${ms} ms`;

      const seconds = ms / 1000;
      if (seconds < 60) return `${seconds.toFixed(1)} seconds`;

      const minutes = Math.floor(ms / 60000);
      const subSeconds = Math.floor((ms % 60000) / 1000);

      if (minutes < 60) return `${minutes} minutes ${subSeconds} seconds`;

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hours ${remainingMinutes} minutes`;
    };

    // Format Date
    const formatDate = (dateString: string | undefined): string => {

      if (!dateString) return 'Unknown Date';

      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = date.toLocaleDateString(undefined, options);

      const day = date.getDate() + 1;
      const suffix =
        day % 10 === 1 && day !== 11
          ? 'st'
          : day % 10 === 2 && day !== 12
          ? 'nd'
          : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th';

      return formattedDate.replace(/\d+/, `${day}${suffix}`);
    };

    return (
      <div className="bg-white shadow-md p-3 rounded-md border">
        <p className="font-semibold pb-2">{formatDate(label)}</p>

        <p className={`text-blue-600 pb-2 ${checkActive('estimatedCost')}`}>
          Estimated Cost: ${objData.estimatedCost}</p>

        <p className={`text-grey-500 ${checkActive('count')}`}>
            Bots Used: {objData.count}</p>

        <p className={`text-grey-600 ${checkActive('msEllapsed')}`}>
          Total Time: {formatDuration(objData.msEllapsed)}</p>

      </div>
    );
  };