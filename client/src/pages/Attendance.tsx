import React, { useEffect, useState } from 'react';
import { parseISO, differenceInMinutes } from 'date-fns';
import { Calendar, MapPin, Clock, TrendingUp } from 'lucide-react'; // or wherever your icons are from

import { getCurrentUser } from '../utils/auth';
import {
  getCurrentDate,
  getCurrentTime,
} from '../utils/dateUtils';

// Interfaces
interface AttendanceRecord {
  user_id: string;
  id: string;
  userId: string;
  date: string;
  punch_in: string | null;
  punch_out: string | null;
  created_at: string;
}

interface MappedAttendance {
  id: string;
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  totalHours: number;
  status: string;
}

// Utility: Normalize and map latest attendance per date
function getLatestPerDate(records: AttendanceRecord[]): MappedAttendance[] {
  const grouped: Record<string, AttendanceRecord[]> = {};

  for (const record of records) {
    if (!grouped[record.date]) grouped[record.date] = [];
    grouped[record.date].push(record);
  }

  return Object.entries(grouped).map(([date, entries]) => {
    const latest = entries.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const punchIn = latest.punch_in;
    const punchOut = latest.punch_out;
    let totalHours = 0;

    if (punchIn && punchOut) {
      const start = parseISO(`${latest.date}T${punchIn}`);
      const end = parseISO(`${latest.date}T${punchOut}`);
      totalHours = differenceInMinutes(end, start) / 60;
    }

    const status =
      punchIn && punchOut
        ? totalHours >= 8
          ? 'present'
          : 'late'
        : 'absent';

    return {
      id: latest.id,
      date: latest.date,
      punchIn,
      punchOut,
      totalHours: Number(totalHours.toFixed(2)),
      status,
    };
  });
}

const formatTime = (time: string): string => {
  const [hour, minute] = time.split(':');
  const date = new Date();
  date.setHours(Number(hour), Number(minute));
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Component
const Attendance: React.FC = () => {
  const user = getCurrentUser();
  const today = getCurrentDate();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [weeklyAttendance, setWeeklyAttendance] = useState<MappedAttendance[]>([]);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [punchInTime, setPunchInTime] = useState<string | null>(null);

  const fetchAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user?.id) throw new Error('Unauthorized');

      const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/employee/attendance/`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch attendance data');

      const data: AttendanceRecord[] = await res.json();
      setAttendance(data);

      const latestPerDay = getLatestPerDate(data);
      const last7 = latestPerDay.slice(-7);
      setWeeklyAttendance(last7);

      const todayRecord = latestPerDay.find((r) => r.date === today);

      if (todayRecord?.punchIn && !todayRecord.punchOut) {
        setIsPunchedIn(true);
        setPunchInTime(todayRecord.punchIn);
      } else {
        setIsPunchedIn(false);
        setPunchInTime(null);
      }
    } catch (err: any) {
      console.error('Attendance fetch error:', err.message || err);
    }
  };

  useEffect(() => {
    if (user?.id) fetchAttendance();
  }, [user?.id]);

  const handlePunchIn = async () => {
    const currentTime = getCurrentTime();

    if (isPunchedIn) {
      console.warn('Already punched in for today.');
      return;
    }

    setIsPunchedIn(true);
    setPunchInTime(currentTime);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized');

      const res = await fetch(`https://nts-erp-system-629k.vercel.app/api/employee/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          punch_in: currentTime,
          date: today,
          status: 'present',
        }),
      });

      if (!res.ok) throw new Error('Failed to punch in');
      console.log('Punched in at:', currentTime);

      await new Promise((r) => setTimeout(r, 500)); // small delay
      await fetchAttendance();
    } catch (err: any) {
      console.error('Punch in error:', err.message || err);
    }
  };

 const handlePunchOut = async () => {
  const currentTime = getCurrentTime();
  setIsPunchedIn(false);

  try {
    const token = localStorage.getItem('token');
    if (!token || !user?.id) throw new Error('Unauthorized');

    const todayRecord = attendance.find(
      (r) =>
        r.user_id === user.id &&
        r.date === today &&
        r.punch_in &&
        !r.punch_out
    );

    if (!todayRecord) {
      console.warn('No punch-in record found for today to punch out.');
      return;
    }

    const res = await fetch(
      `https://nts-erp-system-629k.vercel.app/api/employee/attendance/${today}`, // Use date instead of ID
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ punch_out: currentTime }),
      }
    );

    if (!res.ok) throw new Error('Failed to punch out');
    console.log('Punched out at:', currentTime);

    await fetchAttendance();
  } catch (err: any) {
    console.error('Punch out error:', err.message || err);
  }
};

  const totalHours = weeklyAttendance.reduce((sum, a) => sum + a.totalHours, 0);
  const avgHours = weeklyAttendance.length ? totalHours / weeklyAttendance.length : 0;
const todayAttendance = weeklyAttendance.find((r) => r.date === today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-600 mt-1">
          Track your daily attendance and working hours
        </p>
      </div>

      {/* Punch In/Out Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {isPunchedIn ? "You're Checked In" : "Ready to Start?"}
            </h2>
            <p className="text-blue-100 mb-4">
              {isPunchedIn
                ? `Checked in at ${
                    punchInTime ? formatTime(punchInTime) : "N/A"
                  }`
                : "Click the button below to punch in"}
            </p>

            <div className="flex items-center space-x-4 text-sm text-blue-100">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>Office</span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-4">
              {new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <button
              onClick={isPunchedIn ? handlePunchOut : handlePunchIn}
              className={`px-8 py-3 rounded-lg font-semibold transition-colors ${
                isPunchedIn
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-white text-blue-600 hover:bg-gray-100"
              }`}
            >
              {isPunchedIn ? "Punch Out" : "Punch In"}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Hours</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {todayAttendance?.totalHours || 0}h
              </p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Weekly Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalHours.toFixed(1)}h
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Daily Average</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {avgHours.toFixed(1)}h
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Attendance
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Date
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  In Time
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Out Time
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Total Hours
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {weeklyAttendance.map((attendance) => (
                <tr key={attendance.id} className="border-b border-gray-100">
                  <td className="py-3 px-4">
                    {new Date(attendance.date).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4">
                    {attendance.punchIn ? formatTime(attendance.punchIn) : "-"}
                  </td>

                  <td className="py-3 px-4">
                    {attendance.punchOut
                      ? formatTime(attendance.punchOut)
                      : "-"}
                  </td>

                  <td className="py-3 px-4">{attendance.totalHours || 0}h</td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        attendance.status === "present"
                          ? "bg-green-100 text-green-800"
                          : attendance.status === "late"
                          ? "bg-yellow-100 text-yellow-800"
                          : attendance.status === "absent"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {attendance.status || "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};



export default Attendance;
