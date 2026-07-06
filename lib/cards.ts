import type { CardDef, CardTypeId } from "./types";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function make(type: CardTypeId, names: string[]): CardDef[] {
  return names.map((name) => ({
    id: `${type}-${slug(name)}`,
    type,
    name,
    image: `/placeholders/${type === "person" ? "persons" : `${type}s`}/${slug(name)}.png`,
  }));
}

export const DEFAULT_CARDS: Record<CardTypeId, CardDef[]> = {
  person: make("person", [
    "Rick Sanchez",
    "Morty Smith",
    "Summer Smith",
    "Beth Smith",
    "Jerry Smith",
    "Mr. Poopybutthole",
    "Birdperson",
    "Squanchy",
    "Evil Morty",
    "Mr. Meeseeks",
  ]),
  location: make("location", [
    "Smith Garage",
    "Citadel of Ricks",
    "Blips and Chitz",
    "Cromulon Planet",
    "Bird World",
    "Froopyland",
    "Interdimensional Cable",
    "Gazorpazorp",
  ]),
  weapon: make("weapon", [
    "Portal Gun",
    "Plumbus",
    "Meeseeks Box",
    "Dark Matter Gun",
    "Snake Laser",
    "Neutrino Bomb",
    "C-137 Knife",
  ]),
  motive: make("motive", [
    "Revenge",
    "Pure Science",
    "Saving Family",
    "Galactic Federation Order",
    "Drunk Power",
    "Existential Dread",
  ]),
  time: make("time", [
    "Portal Dawn",
    "Cromulon Night",
    "Schroedinger's Hour",
    "Squanch O'Clock",
    "Interdimensional Midnight",
  ]),
};

export const ALL_CARDS: CardDef[] = Object.values(DEFAULT_CARDS).flat();

export function cardById(id: string): CardDef | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}

export const UI_IMAGES = {
  logo: "/placeholders/ui/logo.png",
  cardBack: "/placeholders/ui/card-back.png",
  envelope: "/placeholders/ui/envelope.png",
  portalGreen: "/placeholders/ui/portal-green.png",
};
