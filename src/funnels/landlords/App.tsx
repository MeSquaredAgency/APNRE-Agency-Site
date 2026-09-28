import Header from './components/Header';
import Hero from './components/Hero';
import LandlordProblem from './components/LandlordProblem';
import WhyApn from './components/WhyApn';
import Team from './components/Team';
import OfficesStrip from './components/OfficesStrip';
import Proof from './components/Proof';
import SwitchSection from './components/SwitchSection';
import AppraisalForm from './components/AppraisalForm';
import Faq from './components/Faq';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';
import StickyMobileCta from './components/StickyMobileCta';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LandlordProblem />
        <WhyApn />
        <Team />
        <OfficesStrip />
        <Proof />
        <SwitchSection />
        <AppraisalForm />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <StickyMobileCta />
    </>
  );
}
