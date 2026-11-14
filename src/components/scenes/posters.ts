import alpineAurora from '../../assets/scene-posters/alpineAurora.webp';
import astronaut from '../../assets/scene-posters/astronaut.webp';
import comicCity from '../../assets/scene-posters/comicCity.webp';
import discoEighties from '../../assets/scene-posters/discoEighties.webp';
import jerichoCollapse from '../../assets/scene-posters/jerichoCollapse.webp';
import fjordStorm from '../../assets/scene-posters/fjordStorm.webp';
import gloryCross from '../../assets/scene-posters/gloryCross.webp';
import livingReef from '../../assets/scene-posters/livingReef.webp';
import rainbowForest from '../../assets/scene-posters/rainbowForest.webp';
import type { ScenicBackgroundPreset } from '../../lib/scenicBackgrounds';

const posters: Record<ScenicBackgroundPreset, string> = {
  comicCity, jerichoCollapse, fjordStorm, livingReef, alpineAurora,
  rainbowForest, astronaut, gloryCross, discoEighties,
};

export function scenicPosterStyle(preset: ScenicBackgroundPreset, color: string) {
  return { backgroundColor: color, backgroundImage: `url("${posters[preset]}")` };
}
