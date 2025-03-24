// This file contains dummy GPS data for testing when real GPS doesn't work indoors

export interface GpsDataPoint {
  time: string;
  latitude: number;
  longitude: number;
  altitude: number;
  satellites?: number;
  signalStrength?: number;
}

// Convert the Turkish data keys to English for consistency
export const dummyGpsData: GpsDataPoint[] = [
  {
    time: "17.03.2025_18:57:13",
    latitude: 41.013645833333335,
    longitude: 28.831767666666668,
    altitude: 70.1
  },
  {
    time: "17.03.2025_18:57:14",
    latitude: 41.01364516666667,
    longitude: 28.8317735,
    altitude: 70.5
  },
  {
    time: "17.03.2025_18:57:15",
    latitude: 41.01364516666667,
    longitude: 28.831776,
    altitude: 70.6
  },
  {
    time: "17.03.2025_18:57:16",
    latitude: 41.013645833333335,
    longitude: 28.831773833333333,
    altitude: 70.1
  },
  {
    time: "17.03.2025_18:57:17",
    latitude: 41.01364616666667,
    longitude: 28.831772,
    altitude: 69.8
  },
  {
    time: "17.03.2025_18:57:18",
    latitude: 41.013646,
    longitude: 28.831774333333332,
    altitude: 69.8
  },
  {
    time: "17.03.2025_18:57:19",
    latitude: 41.013646,
    longitude: 28.8317755,
    altitude: 69.7
  },
  {
    time: "17.03.2025_18:57:20",
    latitude: 41.013646333333334,
    longitude: 28.831776166666668,
    altitude: 69.7
  },
  {
    time: "17.03.2025_18:57:21",
    latitude: 41.0136465,
    longitude: 28.831776666666666,
    altitude: 69.6
  },
  {
    time: "17.03.2025_18:57:22",
    latitude: 41.013646333333334,
    longitude: 28.831777833333334,
    altitude: 69.4
  },
  {
    time: "17.03.2025_18:57:23",
    latitude: 41.013646666666666,
    longitude: 28.831778,
    altitude: 69.4
  },
  {
    time: "17.03.2025_18:57:24",
    latitude: 41.013647,
    longitude: 28.831778666666665,
    altitude: 69.5
  },
  {
    time: "17.03.2025_18:57:25",
    latitude: 41.0136465,
    longitude: 28.831782333333333,
    altitude: 69.9
  },
  {
    time: "17.03.2025_18:57:26",
    latitude: 41.0136455,
    longitude: 28.831785833333335,
    altitude: 70.1
  },
  {
    time: "17.03.2025_18:57:27",
    latitude: 41.0136455,
    longitude: 28.831786333333334,
    altitude: 70.1
  },
  {
    time: "17.03.2025_18:57:28",
    latitude: 41.01364566666667,
    longitude: 28.831785333333332,
    altitude: 70.1
  },
  {
    time: "17.03.2025_18:57:29",
    latitude: 41.0136455,
    longitude: 28.831784166666665,
    altitude: 70.2
  },
  {
    time: "17.03.2025_18:57:30",
    latitude: 41.013645333333336,
    longitude: 28.831783,
    altitude: 69.8
  },
  {
    time: "17.03.2025_18:57:31",
    latitude: 41.013645333333336,
    longitude: 28.831781666666668,
    altitude: 69.7
  },
  {
    time: "17.03.2025_18:57:32",
    latitude: 41.013646,
    longitude: 28.83178283333333,
    altitude: 69.9
  },
  {
    time: "17.03.2025_18:57:33",
    latitude: 41.01364566666667,
    longitude: 28.8317855,
    altitude: 70.0
  },
  {
    time: "17.03.2025_18:57:34",
    latitude: 41.01364566666667,
    longitude: 28.831787333333335,
    altitude: 70.1
  },
  {
    time: "17.03.2025_18:57:35",
    latitude: 41.013645333333336,
    longitude: 28.831790166666668,
    altitude: 70.2
  },
  {
    time: "17.03.2025_18:57:36",
    latitude: 41.013645333333336,
    longitude: 28.83179,
    altitude: 70.2
  },
  {
    time: "17.03.2025_18:57:37",
    latitude: 41.013645333333336,
    longitude: 28.831789,
    altitude: 70.0
  },
  {
    time: "17.03.2025_18:57:38",
    latitude: 41.01364483333333,
    longitude: 28.83179,
    altitude: 70.2
  },
  {
    time: "17.03.2025_18:57:39",
    latitude: 41.01364516666667,
    longitude: 28.831786666666666,
    altitude: 69.8
  },
  {
    time: "17.03.2025_18:57:40",
    latitude: 41.013645,
    longitude: 28.8317845,
    altitude: 69.8
  },
  {
    time: "17.03.2025_18:57:41",
    latitude: 41.0136455,
    longitude: 28.831779333333333,
    altitude: 69.4
  },
  {
    time: "17.03.2025_18:57:42",
    latitude: 41.013645333333336,
    longitude: 28.8317765,
    altitude: 69.2
  },
  {
    time: "17.03.2025_18:57:43",
    latitude: 41.013645333333336,
    longitude: 28.831774333333332,
    altitude: 69.0
  },
  {
    time: "17.03.2025_18:57:44",
    latitude: 41.01364483333333,
    longitude: 28.831776,
    altitude: 69.2
  },
  {
    time: "17.03.2025_18:57:45",
    latitude: 41.01364433333333,
    longitude: 28.831777833333334,
    altitude: 69.7
  },
  {
    time: "17.03.2025_18:57:46",
    latitude: 41.0136445,
    longitude: 28.831776166666668,
    altitude: 69.4
  },
  {
    time: "17.03.2025_18:57:47",
    latitude: 41.013644166666666,
    longitude: 28.831776333333334,
    altitude: 69.3
  },
  {
    time: "17.03.2025_18:57:48",
    latitude: 41.01364433333333,
    longitude: 28.831772333333333,
    altitude: 68.9
  },
  {
    time: "17.03.2025_18:57:49",
    latitude: 41.013644,
    longitude: 28.831774,
    altitude: 69.1
  },
  {
    time: "17.03.2025_18:57:50",
    latitude: 41.01364383333333,
    longitude: 28.8317725,
    altitude: 69.0
  },
  {
    time: "17.03.2025_18:57:51",
    latitude: 41.013643333333334,
    longitude: 28.831774333333332,
    altitude: 69.4
  },
  {
    time: "17.03.2025_18:57:52",
    latitude: 41.0136435,
    longitude: 28.831770166666665,
    altitude: 69.0
  },
  {
    time: "17.03.2025_18:57:53",
    latitude: 41.01364483333333,
    longitude: 28.8317665,
    altitude: 68.5
  },
  {
    time: "17.03.2025_18:57:54",
    latitude: 41.01364483333333,
    longitude: 28.831767166666666,
    altitude: 68.5
  },
  {
    time: "17.03.2025_18:57:55",
    latitude: 41.01364483333333,
    longitude: 28.831765166666667,
    altitude: 68.1
  },
  {
    time: "17.03.2025_18:57:56",
    latitude: 41.01364516666667,
    longitude: 28.8317635,
    altitude: 67.8
  },
  {
    time: "17.03.2025_18:57:57",
    latitude: 41.013646666666666,
    longitude: 28.8317535,
    altitude: 66.3
  },
  {
    time: "17.03.2025_18:57:58",
    latitude: 41.013647666666664,
    longitude: 28.8317475,
    altitude: 65.3
  },
  {
    time: "17.03.2025_18:57:59",
    latitude: 41.013648,
    longitude: 28.831743333333332,
    altitude: 65.1
  },
  {
    time: "17.03.2025_18:58:00",
    latitude: 41.01364816666667,
    longitude: 28.831743,
    altitude: 65.2
  },
  {
    time: "17.03.2025_18:58:01",
    latitude: 41.013648833333335,
    longitude: 28.83174066666667,
    altitude: 64.8
  },
  {
    time: "17.03.2025_18:58:02",
    latitude: 41.0136495,
    longitude: 28.831738333333334,
    altitude: 64.5
  },
  {
    time: "17.03.2025_18:58:03",
    latitude: 41.0136495,
    longitude: 28.831739166666665,
    altitude: 64.3
  },
  {
    time: "17.03.2025_18:58:04",
    latitude: 41.01365033333333,
    longitude: 28.831736166666666,
    altitude: 63.5
  },
  {
    time: "17.03.2025_18:58:05",
    latitude: 41.01365066666666,
    longitude: 28.831737,
    altitude: 63.5
  },
  {
    time: "17.03.2025_18:58:06",
    latitude: 41.0136515,
    longitude: 28.831735666666667,
    altitude: 63.1
  },
  {
    time: "17.03.2025_18:58:07",
    latitude: 41.01365083333334,
    longitude: 28.83173783333333,
    altitude: 62.8
  },
  {
    time: "17.03.2025_18:58:09",
    latitude: 41.0136505,
    longitude: 28.831738666666666,
    altitude: 62.3
  },
  {
    time: "17.03.2025_18:58:10",
    latitude: 41.013651333333335,
    longitude: 28.831735166666668,
    altitude: 61.5
  },
  {
    time: "17.03.2025_18:58:11",
    latitude: 41.01365083333334,
    longitude: 28.831737,
    altitude: 61.4
  },
  {
    time: "17.03.2025_18:58:12",
    latitude: 41.013650166666665,
    longitude: 28.831735666666667,
    altitude: 60.9
  },
  {
    time: "17.03.2025_18:58:13",
    latitude: 41.013648333333336,
    longitude: 28.831739666666667,
    altitude: 61.1
  },
  {
    time: "17.03.2025_18:58:14",
    latitude: 41.0136465,
    longitude: 28.8317505,
    altitude: 61.9
  },
  {
    time: "17.03.2025_18:58:15",
    latitude: 41.013645833333335,
    longitude: 28.831755166666667,
    altitude: 62.1
  },
  {
    time: "17.03.2025_18:58:16",
    latitude: 41.0136455,
    longitude: 28.831758666666666,
    altitude: 62.2
  },
  {
    time: "17.03.2025_18:58:17",
    latitude: 41.013645833333335,
    longitude: 28.831759666666667,
    altitude: 62.2
  }
]; 