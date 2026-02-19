import Header from "@/components/Header";
import PageBackground from "@/components/PageBackground";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <PageBackground />
      <main className="relative z-10 min-h-screen pt-16">
        <Booking />
      </main>
      <Footer />
    </>
  );
}
