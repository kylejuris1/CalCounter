"use client"

import { useState } from "react"
import Header from "@/components/header"
import TabNavigation from "@/components/tab-navigation"
import CalorieOverview from "@/components/calorie-overview"
import MacroCircles from "@/components/macro-circles"
import RecentlyUploaded from "@/components/recently-uploaded"
import BottomNav from "@/components/bottom-nav"

function todayDateString() {
  return new Date().toISOString().split("T")[0]
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(todayDateString())
  const [activePage, setActivePage] = useState("home")

  const handleLogoClick = () => {
    setActivePage("home")
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <Header onLogoClick={handleLogoClick} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4">
        {activePage === "home" && (
          <>
            {/* Tab Navigation */}
            <TabNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

            {/* Calorie Overview */}
            <CalorieOverview />

            {/* Macro Circles */}
            <MacroCircles />

            {/* Recently Uploaded */}
            <RecentlyUploaded />
          </>
        )}

        {activePage === "analytics" && (
          <div className="py-8">
            <h2 className="text-2xl font-bold mb-8">Analytics</h2>

            {/* Weekly Summary Placeholder */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Weekly Summary</h3>
              <div className="h-40 bg-gray-700 rounded flex items-center justify-center text-gray-500">
                Chart Placeholder - Weekly Calorie Trend
              </div>
            </div>

            {/* Stats Grid Placeholder */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Avg Daily Intake</p>
                <p className="text-xl font-bold">2,350 cal</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Workouts</p>
                <p className="text-xl font-bold">12</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Macro Avg</p>
                <p className="text-xs text-gray-300 mt-2">P: 120g | C: 250g | F: 80g</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Streak</p>
                <p className="text-xl font-bold">24 days</p>
              </div>
            </div>

            {/* Detailed Breakdown Placeholder */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Daily Breakdown</h3>
              <div className="space-y-3">
                <div className="h-8 bg-gray-800 rounded" />
                <div className="h-8 bg-gray-800 rounded" />
                <div className="h-8 bg-gray-800 rounded" />
              </div>
            </div>
          </div>
        )}

        {activePage === "settings" && (
          <div className="py-8">
            <h2 className="text-2xl font-bold mb-8">Settings</h2>

            {/* Account Settings */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Account</h3>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <span className="text-sm">Email</span>
                  <span className="text-xs text-gray-500">user@example.com</span>
                </div>
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <span className="text-sm">Username</span>
                  <span className="text-xs text-gray-500">username</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm">Password</span>
                  <span className="text-xs text-orange-500 cursor-pointer">Change</span>
                </div>
              </div>
            </div>

            {/* Nutrition Goals */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Nutrition Goals</h3>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <span className="text-sm">Daily Calorie Target</span>
                  <span className="text-xs text-gray-500">2,500 cal</span>
                </div>
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <span className="text-sm">Protein Goal</span>
                  <span className="text-xs text-gray-500">150g</span>
                </div>
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <span className="text-sm">Carbs Goal</span>
                  <span className="text-xs text-gray-500">300g</span>
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm">Fats Goal</span>
                  <span className="text-xs text-gray-500">80g</span>
                </div>
              </div>
            </div>

            {/* App Preferences */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Preferences</h3>
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <span className="text-sm">Dark Mode</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <span className="text-sm">Notifications</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm">Units (kg/lbs)</span>
                  <select className="bg-gray-800 text-xs rounded px-2 py-1">
                    <option>kg</option>
                    <option>lbs</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4">
                <button className="text-sm text-red-500 hover:text-red-400 transition-colors">Delete Account</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activePage={activePage} onPageChange={setActivePage} />
    </div>
  )
}
