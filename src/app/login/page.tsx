"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Film, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/constants";
import Link from "next/link";

export default function UserLoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && (!name || !phone))) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        // Prevent admin login from user portal
        const { data: adminData } = await supabase
          .from("admins")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (adminData && adminData.role === "admin") {
          await supabase.auth.signOut();
          toast.error("Unauthorized login attempt.");
          setLoading(false);
          return;
        }

        toast.success("Welcome back!");
        router.push("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone,
            },
          },
        });
        if (error) throw error;
        toast.success("Account created successfully! You can now log in.");
        setIsLogin(true);
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden pt-[72px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-4 relative z-10"
      >
        <div className="bg-white border border-[#E8E8EA] shadow-xl rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="w-16 h-16 rounded-2xl bg-[#131316] mx-auto mb-4 flex items-center justify-center shadow-md">
                <Film className="w-8 h-8 text-white" />
              </div>
            </Link>
            <h1 className="font-display text-2xl font-bold text-[#131316]">{isLogin ? "Welcome Back" : "Create Account"}</h1>
            <p className="text-[#8E8E93] text-sm mt-1">
              {isLogin ? "Sign in to book tickets faster" : "Join us for a seamless booking experience"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#545459]">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="bg-white text-[#131316] border-[#D0D0D4] focus:border-[#0B70D5]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#545459]">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit number"
                    maxLength={10}
                    className="bg-white text-[#131316] border-[#D0D0D4] focus:border-[#0B70D5]"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#545459]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="bg-white text-[#131316] border-[#D0D0D4] focus:border-[#0B70D5]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#545459]">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Enter password" : "Create a password"}
                  className="bg-white text-[#131316] border-[#D0D0D4] focus:border-[#0B70D5] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#545459]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-xl bg-[#0B70D5] text-white hover:bg-[#0A60B5] mt-6" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                isLogin ? "Sign In" : "Sign Up"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-[#545459] mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-semibold text-[#0B70D5] hover:underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
