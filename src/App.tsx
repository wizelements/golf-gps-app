// ============================================
// Golf GPS Tracker - Main App Component
// ============================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { initializeGPS } from '@/services/gps';
import { BottomNav } from '@/ui/components/Navigation';
import { HomeScreen } from '@/features/home/HomeScreen';
import { CourseList } from '@/features/course/CourseList';
import { CourseBuilder } from '@/features/course/CourseBuilder';
import { CourseDetail } from '@/features/course/CourseDetail';
import { RoundScreen } from '@/features/round/RoundScreen';
import { RoundList } from '@/features/round/RoundList';
import { ReplayScreen } from '@/features/analysis/ReplayScreen';
import { StatsScreen } from '@/features/analysis/StatsScreen';
import { QuickPlayScreen } from '@/features/quickplay/QuickPlayScreen';
import '@/ui/styles.css';

export default function App() {
  useEffect(() => {
    initializeGPS();
  }, []);

  return (
    <BrowserRouter basename="/golf-gps-app">
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        {/* QuickPlay routes - the magic! */}
        <Route path="/quickplay/:courseId" element={<QuickPlayScreen />} />
        <Route path="/quickplay/osm/:osmData" element={<QuickPlayScreen />} />
        <Route path="/quickplay/new/:newCourseName" element={<QuickPlayScreen />} />
        {/* Legacy routes */}
        <Route path="/courses" element={<CourseList />} />
        <Route path="/courses/new" element={<CourseBuilder />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/courses/:courseId/edit" element={<CourseBuilder />} />
        <Route path="/round/:roundId" element={<RoundScreen />} />
        <Route path="/rounds" element={<RoundList />} />
        <Route path="/replay/:roundId" element={<ReplayScreen />} />
        <Route path="/stats" element={<StatsScreen />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
