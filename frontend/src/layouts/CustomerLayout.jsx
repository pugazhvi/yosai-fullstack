import { Outlet } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import NavigationBar from "@/components/NavigationBar";
import WhatsappButton from "@/components/WhatsappButton";

export default function CustomerLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fffdfe]">
      <NavBar />
      <main className="flex-1 pt-[68px] sm:pt-24">
        <Outlet />
      </main>
      <Footer />
      <NavigationBar />
      <WhatsappButton />
    </div>
  );
}
