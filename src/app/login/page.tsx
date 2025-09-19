"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowLeft, Globe, Lock, User } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                MAPIM Strategic Centre
              </span>
            </div>
            <Link href="/" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors font-medium">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Login Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Admin Login
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Access the MAPIM Strategic Centre admin dashboard
            </p>
          </div>

          <Card className="border-0 bg-white dark:bg-slate-800 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900 dark:text-white text-center">
                Sign In
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 text-center">
                Enter your credentials to access the admin panel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                  Email Address
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@mapim.org"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button className="w-full bg-emerald-800 hover:bg-emerald-900 text-white">
                <Shield className="w-4 h-4 mr-2" />
                Sign In
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Forgot your password?{" "}
                  <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                    Reset here
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Need access? Contact the system administrator
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-slate-400">&copy; 2025 MAPIM Strategic Centre. All rights reserved. v2.0</p>
        </div>
      </footer>
    </div>
  );
}
