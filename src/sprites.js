const BODIES = {
  duck: ["            ", "    __      ", "  <({E} )___  ", "   (  ._>   ", "    `--´    "],
  goose: ["            ", "     ({E}>    ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
  blob: ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (      )  ", "   `----´   "],
  cat: ["            ", "   /\\_/\\    ", "  ( {E}   {E})  ", "  (  ω  )   ", "  (\")_(\")   "],
  dragon: ["            ", "  /^\\  /^\\  ", " <  {E}  {E}  > ", " (   ~~   ) ", "  `-vvvv-´  "],
  octopus: ["            ", "   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  /\\/\\/\\/\\  "],
  owl: ["            ", "   /\\  /\\   ", "  (({E})({E}))  ", "  (  ><  )  ", "   `----´   "],
  penguin: ["            ", "  .---.     ", "  ({E}>{E})     ", " /(   )\\    ", "  `---´     "],
  turtle: ["            ", "   _,--._   ", "  ( {E}  {E} )  ", " /[______]\\ ", "  ``    ``  "],
  snail: ["            ", " {E}    .--.  ", "  \\  ( @ )  ", "   \\_`--´   ", "  ~~~~~~~   "],
  ghost: ["            ", "   .----.   ", "  / {E}  {E} \\  ", "  |      |  ", "  ~`~``~`~  "],
  axolotl: ["            ", "}~(______)~{", "}~({E} .. {E})~{", "  ( .--. )  ", "  (_/  \\_)  "],
  capybara: ["            ", "  n______n  ", " ( {E}    {E} ) ", " (   oo   ) ", "  `------´  "],
  cactus: ["            ", " n  ____  n ", " | |{E}  {E}| | ", " |_|    |_| ", "   |    |   "],
  robot: ["            ", "   .[||].   ", "  [ {E}  {E} ]  ", "  [ ==== ]  ", "  `------´  "],
  rabbit: ["            ", "   (\\__/)   ", "  ( {E}  {E} )  ", " =(  ..  )= ", "  (\")__(\")  "],
  mushroom: ["            ", " .-o-OO-o-. ", "(__________)", "   |{E}  {E}|   ", "   |____|   "],
  chonk: ["            ", "  /\\    /\\  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------´  "]
};

const HAT_LINES = {
  none: "",
  crown: "   \\^^^/    ",
  tophat: "   [___]    ",
  propeller: "    -+-     ",
  halo: "   (   )    ",
  wizard: "    /^\\     ",
  beanie: "   (___)    ",
  tinyduck: "    ,>      "
};

function normalizeInput(subject, eye, hat) {
  if (typeof subject === "object" && subject !== null) {
    return subject;
  }
  return { species: subject, eye, hat };
}

export function renderSpriteLines(subject, eye, hat) {
  const roll = normalizeInput(subject, eye, hat);
  const body = (BODIES[roll.species] || BODIES.blob).map((line) => line.replaceAll("{E}", roll.eye));
  const lines = [...body];
  if (roll.hat !== "none" && !lines[0].trim()) {
    lines[0] = HAT_LINES[roll.hat] || "";
  }
  return lines;
}

export function renderSprite(subject, eye, hat) {
  return renderSpriteLines(subject, eye, hat).join("\n");
}
