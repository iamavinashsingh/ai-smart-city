// Create directory pages first by placing files in it
import Hero from "../components/sections/Hero"
import HowItWorks from "../components/sections/HowItWorks"
import MapPreview from "../components/sections/MapPreview"
import TechHighlight from "../components/sections/TechHighlight"
import Benefits from "../components/sections/Benefits"
import CtaBanner from "../components/sections/CtaBanner"

export default function LandingPage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <MapPreview />
      <TechHighlight />
      <Benefits />
      <CtaBanner />
    </main>
  )
}
