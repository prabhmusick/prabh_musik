import TrustedBrandsBar from "./TrustedBrandsBar";
import ArtistsWorkedWith from "./ArtistsWorkedWith";
import TrendingBeats from "./TrendingBeats";
import HeroSection from "./Hero";
import PopularGenres from "./genre";
import BeatstarsHero from "./Beatstar";
import Testimonials from "./testimonials";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustedBrandsBar />
      <ArtistsWorkedWith />
      <TrendingBeats />
      <PopularGenres />
      <BeatstarsHero />
      <Testimonials />
    </>
  );
}
