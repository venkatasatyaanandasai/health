import React, { useState } from "react";
import Navbar from "../Components/Navbar";
import LiveChat from "../Components/LiveChat";
import Hero from "../Components/Hero";
import Info from "../Components/Info";
import About from "../Components/About";
import BookAppointment from "../Components/BookAppointment";
import Reviews from "../Components/Reviews";
import Doctors from "../Components/Doctors";
import Footer from "../Components/Footer";

function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="home-section">
      <Navbar onOpenChat={() => setChatOpen(true)} />
      <Hero />
      <Info />
      <About />
      <BookAppointment />
      <Reviews />
      <Doctors />
      <Footer />
      <LiveChat
        isOpen={chatOpen}
        onOpen={() => setChatOpen(true)}
        onClose={() => setChatOpen(false)}
      />
    </div>
  );
}

export default Home;