"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, Ticket, Calendar, Clock, MapPin } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { getUserBookings } from "@/actions/bookings";
import { PageTransition } from "@/components/shared/page-transition";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/utils";
import type { Booking } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndBookings = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/login");
        return;
      }
      
      setUser(session.user);
      
      try {
        if (session.user.email) {
          const userBookings = await getUserBookings(session.user.email);
          setBookings(userBookings);
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndBookings();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#0B70D5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-12 bg-[#F9FAFB]">
        <div className="container-app max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#E5E7EB] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#131316]">My Profile</h1>
              <p className="text-[#545459]">{user?.email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 gap-2">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>

          {/* Bookings Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#131316] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#0B70D5]" />
              My Tickets
            </h2>
            
            {bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-[#E5E7EB]">
                <div className="w-16 h-16 bg-[#F3F4F6] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-8 h-8 text-[#9CA3AF]" />
                </div>
                <h3 className="text-lg font-bold text-[#131316] mb-2">No tickets found</h3>
                <p className="text-[#545459] mb-6">Looks like you haven&apos;t booked any movies yet.</p>
                <Link href="/">
                  <Button className="bg-[#0B70D5] hover:bg-[#095BB0]">Book a Movie</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => {
                  const movie = booking.showtime?.movie;
                  return (
                    <Link key={booking.id} href={`/booking/confirmation?id=${booking.booking_id}`} className="no-underline group">
                      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E5E7EB] hover:border-[#0B70D5]/30 hover:shadow-md transition-all flex flex-col sm:flex-row gap-5">
                        {/* Poster Placeholder or actual poster */}
                        <div className="w-24 h-36 bg-[#F3F4F6] rounded-xl shrink-0 overflow-hidden relative">
                          {movie?.poster_url ? (
                            <Image src={movie.poster_url} alt={movie.title} fill className="object-cover" sizes="96px" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Ticket className="w-8 h-8 text-[#D1D5DB]" />
                            </div>
                          )}
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-center space-y-3">
                          <div>
                            <h3 className="font-bold text-lg text-[#131316] group-hover:text-[#0B70D5] transition-colors">{movie?.title || "Movie"}</h3>
                            <p className="text-sm text-[#545459]">Booking ID: <span className="font-mono text-[#131316]">{booking.booking_id}</span></p>
                          </div>
                          
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-1.5 text-[#545459]">
                              <Calendar className="w-4 h-4 text-[#8E8E93]" />
                              {booking.showtime?.show_date ? formatDate(booking.showtime.show_date) : "N/A"}
                            </div>
                            <div className="flex items-center gap-1.5 text-[#545459]">
                              <Clock className="w-4 h-4 text-[#8E8E93]" />
                              {booking.showtime?.show_time ? formatTime(booking.showtime.show_time) : "N/A"}
                            </div>
                            <div className="flex items-center gap-1.5 text-[#545459]">
                              <MapPin className="w-4 h-4 text-[#8E8E93]" />
                              {booking.showtime?.screen_name || "Screen"}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs font-semibold uppercase text-[#8E8E93]">Seats:</span>
                            {(booking.selected_seats as string[]).map(seat => (
                              <span key={seat} className="text-xs px-2 py-1 bg-[#F3F4F6] rounded-md font-medium text-[#131316]">
                                {seat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
