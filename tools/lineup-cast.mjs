// The line-up's cast: a hundred invented people, written by hand. tools/make-lineup.mjs
// turns this into data/lineup.json.
//
// Each row: name, job, quirk, what scores, how they look.
//
// What scores, as words:
//   34            age (20 to 29 score alike, as do 45 and up)
//   e0..e7        education, the option index in src/attributes.js
//   EN9  FR9/5    stronger language and its CLB (3 5 6 7 8 9 10), then the other one's (5 7 9)
//   c2 h1         years of work in Canada (1-5) and its wage tier (1-3)
//   o2            a job offer, by wage tier (1-3)
//   w1 w2         work abroad: one or two years, three or more
//   s1 s2         studied in Canada: a 1-2 year credential, 3+ years
//   sib           a sibling in Canada
//   sp18          an accompanying spouse who brings 18 points
//
// How they look, as words: a hair style, a hat, a top (top:dark|mid|light), glasses,
// a beard, brows, a mouth, one extra, f0..f3 face shape, r for light
// from the right, grey or white for hair. See src/portrait.js for the vocabulary. A later
// word of a kind replaces an earlier one. The shape of the head and body, the features
// and the exact tone are not written here: make-lineup.mjs draws them from the name.
// Some hats and clothes (coil, veil, halo, peaks, cowl, beadband, ruff, yoke, cloak)
// belong to no real place, on purpose.
//
// No origins, and a name says nothing about which language is the stronger one.

export const CAST = [
  ['Odile', 'pastry chef', 'Argues with a sourdough starter. Usually loses.', '34 e3 FR9/5 c2', 'bob toque chef:light'],
  ['Bram', 'glaciologist', 'Has given every ice core a first name.', '27 e7 EN10 w1 s2', 'crop beanie round parka:dark smile f1 r'],
  ['Wendell', 'long-haul trucker', 'Knits at truck stops. Takes commissions.', '47 e1 EN7 o1 w2 sp18', 'crop white cap handlebar plaid stern f2 t1'],
  ['Ines', 'auditor', 'Alphabetises the spice rack, then audits it.', '38 e6 EN9/7 c3 h2', 'bun square blazer:dark raised smirk earrings f3'],
  ['Kofi', 'bike courier', 'Knows every pothole in town by name.', '24 e1 EN6 c1', 'buzz helmet tee:dark grin t2 r'],
  ['Petra', 'beekeeper', 'Apologises to each bee individually.', '41 e2 EN5 w2 sib', 'long white strawhat overalls:light smile freckles f1 t1 wavy yoke'],
  ['Anselm', 'piano tuner', 'Can hear a fridge humming flat from the driveway.', '52 e3 EN8 w2 sp12', 'receding grey fullbeard round turtleneck:dark worried f3'],
  ['Yuki', 'sound engineer', 'Records the rain and rates it out of ten.', '29 e4 EN9 c1 h1 s1', 'fringe headphones hoodie:dark o mic'],
  ['Rosalind', 'welder', 'Signs every weld. Small, but it is there.', '33 e2 EN7 c4 h2', 'afro hiviz:mid thick smirk f2 t2 r'],
  ['Tomas', 'sommelier', 'Describes tap water in three adjectives.', '36 e3 FR10/7 w2', 'part moustache shirt:light bowtie raised ruff'],
  ['Mirela', 'nurse', 'Wins every game of charades by diagnosis.', '31 e4 EN8 c2 h1 sp25', 'ponytail scrubs:mid stethoscope smile f1 t1'],
  ['Dov', 'magician', 'Has never once found the right card first try.', '44 e1 EN9 w2', 'curly tophat goatee blazer:dark stern smirk monocle f3 r cloak'],
  ['Farrukh', 'actuary', 'Calculates the odds of rain, then forgets the umbrella.', '30 e6 EN10/5 c1 h3', 'part square shirt:light tie flat t1 peaks'],
  ['Lindiwe', 'structural engineer', 'Cannot cross a bridge without tapping it.', '35 e6 EN9 c3 h3 sp30', 'curly hardhat hiviz:light smile t2 f1 braids'],
  ['Caspian', 'barista', 'Draws only one latte pattern: a slightly worried swan.', '22 e3 EN8 c1 s1', 'mohawk stubble tee:mid smirk earrings r'],
  ['Noor', 'epidemiologist', 'Keeps a spreadsheet of who brought which cold to the office.', '32 e7 EN10/7 c2 h2', 'long round vneck:dark raised lanyard t1 f3 cowl'],
  ['Benedikt', 'clockmaker', 'Is always eleven minutes late.', '58 e2 EN6 w2', 'bald white moustache shirt:mid monocle worried f2 thin ruff'],
  ['Saoirse', 'marine biologist', 'Gets seasick. Has made peace with it.', '28 e6 EN10 c1 s1', 'pigtails parka:mid freckles grin f1 wavy veil'],
  ['Thabo', 'electrician', 'Labels everything. The label maker has a label.', '39 e2 FR7 c5 sp10', 'buzz hardhat overalls:mid flat t2 f2 r'],
  ['Marisol', 'translator', 'Dreams in subtitles.', '37 e4 FR10/9 c1 w2', 'bob scarf:dark round smile t1 wavy'],
  ['Ignatius', 'philosophy lecturer', 'Still deciding what to order.', '43 e7 EN10/5 w2', 'receding longbeard turtleneck:mid worried round f3 coil'],
  ['Hana', 'pharmacist', 'Counts stairs in multiples of five.', '30 e6 EN9 c1 h2 sib', 'fringe shirt:light lanyard flat f1 yoke'],
  ['Leopold', 'accordion teacher', 'Has been asked to stop exactly once per building.', '61 e3 FR8 w2 sp8', 'part white beret handlebar scarf:mid grin f1 r'],
  ['Amara', 'software developer', 'Names servers after cheeses.', '26 e4 EN10 c2 h3', 'afro headphones hoodie:mid smirk t2'],
  ['Gideon', 'forklift operator', 'Parallel parks like a legend, everywhere.', '34 e1 EN5 c3', 'crop cap stubble hiviz:dark flat f2 t1 beadband'],
  ['Xiomara', 'architect', 'Rearranges hotel rooms on arrival.', '33 e6 EN8/5 w2 o2', 'bun square turtleneck:dark raised t1 f3 r'],
  ['Per', 'lighthouse keeper', 'Finds most rooms too crowded.', '55 e1 EN7 w2', 'crop grey beanie fullbeard parka:dark stern f2 cloak'],
  ['Delphine', 'cheesemonger', 'Can tell which field the cow stood in.', '29 e2 EN9 c1', 'ponytail bandana chef:light smile freckles beadband neckrings'],
  ['Ravindra', 'data analyst', 'Makes a chart before choosing a restaurant.', '27 e6 EN9/5 c1 h1 s1', 'part round vneck:mid flat t2 f3'],
  ['Bettina', 'kindergarten teacher', 'Can silence a room with one eyebrow.', '40 e4 EN8 w2 sp21', 'bob light tee:light raised flower f1 wavy'],
  ['Oluwaseun', 'cardiologist', 'Takes the stairs and tells you about it.', '42 e6 EN10 w2', 'buzz grey scrubs:light stethoscope square smile t2 r coils'],
  ['Kasimir', 'tattoo artist', 'Has no tattoos. Says nobody asked nicely.', '31 e1 FR7 c2', 'mohawk goatee tee:dark stern earrings f3'],
  ['Thandeka', 'pilot', 'Narrates the commute in a calm, even voice.', '36 e4 EN10 w2 o3', 'bun cap shirt:light tie shades t2 braids'],
  ['Jules', 'line cook', 'Owns nine knives and one fork.', '23 e2 EN7 c2', 'crop bandana chef:mid bandaid smirk t1 r'],
  ['Signe', 'furniture restorer', 'Sits on every chair as a matter of principle.', '46 e3 EN6/5 w2 sib', 'long grey overalls:mid pencil flat f3'],
  ['Emeka', 'physiotherapist', 'Corrects the posture of statues.', '29 e6 EN9 c1 h1 s1', 'crop tee:light whistle grin t2 f2 locs'],
  ['Valentina', 'opera singer', 'Sneezes in a perfect C sharp.', '34 e6 EN7/7 w2', 'long blazer:dark necklace o t1 f1 r veil browdots'],
  ['Arvid', 'snowplough driver', 'Has a favourite cul-de-sac. Will not say which.', '49 e1 EN6 c5 sp15', 'receding light beanie stubble parka:mid flat f2 thin'],
  ['Meseret', 'accountant', 'Balances the restaurant bill to the cent, unprompted.', '35 e5 EN8 c2 h1 sp33', 'curly square blazer:mid smile t2 f3 ruff'],
  ['Cormac', 'stand-up comedian', 'Tests new material on self-checkout machines.', '30 e4 EN10 c1', 'curly light stubble tee:dark grin mic freckles coil'],
  ['Liesl', 'veterinary technician', 'Is recognised in the street by eleven dogs.', '25 e3 EN9 c2 s1', 'pigtails light scrubs:mid smile bandaid f1 r'],
  ['Tariq', 'crane operator', 'Afraid of ladders. Not cranes. Ladders.', '37 e2 EN7 c3 h3', 'crop hardhat fullbeard hiviz:mid worried t1 f2'],
  ['Philippa', 'patent lawyer', 'Reads the terms and conditions. All of them.', '39 e6 EN10/9 c4 h3', 'bob light square blazer:dark flat necklace f3'],
  ['Zoran', 'plumber', 'Whistles in the exact key of the pipes.', '45 e2 EN5 c2 sp5', 'bald moustache overalls:dark o f1 t1 r halo'],
  ['Akira', 'animator', 'Blinks on twos.', '28 e4 FR8 c1', 'fringe round hoodie:light pencil smirk f3 beadband'],
  ['Guadalupe', 'midwife', 'Has an exceptionally calm car.', '41 e4 FR9/7 c3 h1', 'bun scrubs:dark smile earrings t1 f1'],
  ['Ebbe', 'librarian', 'Shushes the television.', '53 e6 EN9 w2', 'part grey round turtleneck:light o lanyard f3 r cowl cloak'],
  ['Nkechi', 'civil engineer', 'Rates roundabouts. Most get a six.', '32 e6 EN9 w1 c1 h2 sp28', 'ponytail hardhat shirt:mid smirk t2'],
  ['Rupert', 'butler', 'Irons the newspaper. Also the receipts.', '57 e1 EN10 w2 o1', 'receding white blazer:dark bowtie raised f3 ruff'],
  ['Soledad', 'flamenco teacher', 'Cannot wait in a queue without tapping a rhythm.', '38 e3 EN6/5 w2', 'bun flower vneck:dark stern earrings t1 r'],
  ['Ilya', 'chess coach', 'Thinks four moves ahead about lunch.', '26 e4 EN8/5 w1', 'curly round turtleneck:dark flat f3 cloak'],
  ['Marguerite', 'florist', 'Talks to the tulips. Gossips about the roses.', '44 e2 FR10/5 c5', 'curly grey strawhat overalls:light grin flower f1'],
  ['Desmond', 'bus driver', 'Waves at every other bus. Keeps score of who waves back.', '50 e1 FR8 c4 sp20', 'bald grey moustache shirt:mid tie smile t2 f1 r coils'],
  ['Anneke', 'wind-turbine technician', 'Not bothered by heights. Bothered by pigeons.', '27 e3 EN9 c3 h2 s1', 'ponytail light helmet hiviz:dark smirk freckles'],
  ['Babajide', 'pharmacologist', 'Reads the leaflet inside the box for fun.', '34 e7 EN9/5 c2 h2 sp36', 'buzz square shirt:light lanyard raised t2 f3 coils halo'],
  ['Clementine', 'puppeteer', 'Both hands have distinct opinions.', '31 e4 FR8/7 w1', 'pigtails beret scarf:light grin f1 r'],
  ['Henrik', 'sauna builder', 'Considers eighty degrees a bit fresh.', '42 e2 FR6 w2 o2', 'long light longbeard tee:mid smile f2 coil'],
  ['Priya', 'radiologist', 'Guesses what is inside wrapped presents. Always right.', '37 e6 EN10 c1 h3 sib', 'long scrubs:light square smirk t2 f1'],
  ['Mateus', 'surf instructor', 'Has not worn socks since a wedding.', '24 e1 EN7', 'long light stubble tee:light shades grin t1 r'],
  ['Ottilie', 'cartographer', 'Refuses to use the sat-nav on principle. Often late.', '48 e6 EN10/7 w2 sp24', 'bob grey round scarf:mid raised pencil f3 peaks ruff'],
  ['Jabari', 'firefighter', 'Excellent with cats. Trees optional.', '29 e3 EN8 c4 h1', 'buzz helmet moustache parka:dark grin t2 f2 coils'],
  ['Wilhelmina', 'tax inspector', 'Keeps receipts for the receipts.', '54 e4 EN7 c1 w2', 'bun white square blazer:mid stern necklace f3 r'],
  ['Lucian', 'violin maker', 'Smells wood before buying furniture.', '40 e3 EN6/5 w2 sp3', 'part goatee round shirt:dark worried pencil f3 t1 cowl'],
  ['Aiyana', 'park ranger', 'On first-name terms with a moose.', '33 e4 EN10 c5 h1', 'long strawhat shirt:mid whistle smile t1 f1'],
  ['Fintan', 'sheep farmer', 'Counts sheep professionally and still sleeps badly.', '46 e1 EN9 w2 sib', 'curly light cap fullbeard plaid worried freckles f2 r'],
  ['Zainab', 'biochemist', 'Has strong opinions about loading a dishwasher. Published.', '28 e7 EN9 c1 s2', 'bob round shirt:light lanyard raised t2'],
  ['Oskar', 'tram driver', 'Rings the bell for birthdays.', '35 e2 EN6 c1 sp14', 'part light cap shirt:dark tie grin f1'],
  ['Camille', 'perfumer', 'Can smell Tuesday.', '32 e6 FR10/9 c2 h2', 'fringe turtleneck:light necklace o f3 t1 r halo'],
  ['Tevita', 'rugby coach', 'Gives the pep talk before assembling flat-pack furniture.', '43 e4 EN8 w2 o1 sp17', 'buzz hoodie:mid whistle thick grin t1 f2'],
  ['Gwendolyn', 'crossword setter', 'Seven letters: cannot stop.', '59 e6 EN10', 'curly white square vneck:mid pencil smirk f1 halo cloak'],
  ['Ruben', 'drone pilot', 'Is not allowed to do the wedding again.', '23 e3 EN9 s1', 'fringe light cap hoodie:light shades smirk r'],
  ['Yasmin', 'dentist', 'Hums while working. Takes requests.', '36 e6 EN9/5 c1 h1 w2', 'ponytail scrubs:light grin earrings t1 f1'],
  ['Aurelio', 'gelato maker', 'Believes pistachio is a personality.', '39 e2 EN5 w2 sp9', 'curly toque handlebar chef:light smile t1 f1'],
  ['Tindra', 'game designer', 'Speed-runs the grocery shop.', '27 e4 EN10/5 c3 h2', 'mohawk light headphones hoodie:dark smirk earrings f3 r veil'],
  ['Baraka', 'zookeeper', 'The capybaras have been told too much.', '30 e4 EN8 c2', 'afro overalls:mid whistle grin t2 f1'],
  ['Cosima', 'harpist', 'Needs a bigger car. Has needed one for years.', '34 e6 EN8/7 w1', 'long light vneck:dark necklace flat f3 peaks'],
  ['Mordecai', 'locksmith', 'Locked out twice this year. Will not discuss it.', '51 e1 EN7 c5 h1', 'receding grey goatee square overalls:dark stern f2 r peaks'],
  ['Ngozi', 'air-traffic controller', 'Directs supermarket trolleys with two fingers.', '38 e4 EN10 c3 h3 sp38', 'bun headphones shirt:light mic flat t2'],
  ['Sven', 'commercial diver', 'Holds breath during adverts.', '33 e2 EN7 c1 w2', 'buzz light stubble turtleneck:dark scar flat f2 beadband'],
  ['Paloma', 'wedding photographer', 'Has cried at 214 weddings, including the bad ones.', '29 e4 EN9/7 c1', 'bob beret blazer:mid smile lanyard t1 f1 r yoke'],
  ['Hamish', 'distiller', 'Describes everything as having notes of toffee.', '45 e4 EN10 w2 o3 sib', 'crop grey fullbeard plaid raised smirk f2'],
  ['Chiara', 'particle physicist', 'Collided with the same door three times this week.', '31 e7 EN10/9 w1', 'curly round tee:mid bandaid worried f3'],
  ['Dmitri', 'figure-skating coach', 'Sticks every landing, including off the bus.', '47 e4 EN6 w2 sp11', 'part grey scarf:dark whistle stern f3 r'],
  ['Folasade', 'UX designer', "Has redesigned the office microwave's buttons. Unasked.", '26 e4 EN10 c1 h2 s2', 'afro round vneck:light smirk earrings t2 f1 braids'],
  ['Elio', 'elevator mechanic', 'Takes the stairs. Says nothing.', '41 e2 EN8 c4 h2 sp22', 'crop cap moustache overalls:mid flat t1 f2'],
  ['Winifred', 'archivist', 'Files grudges by date.', '60 e6 EN9/5 w2', 'bun white round turtleneck:mid stern necklace f3 r veil'],
  ['Koa', 'lifeguard', 'Has rescued the same inflatable flamingo four times.', '21 e1 EN9 c1', 'long tee:light whistle shades grin t1'],
  ['Leocadia', 'notary', 'Stamps things for emphasis.', '44 e6 FR9/5 w2', 'bob grey square blazer:dark raised earrings f1'],
  ['Radek', 'stonemason', 'Has a favourite rock and it is not for sale.', '36 e1 EN5 c2 sp6', 'buzz fullbeard tee:mid thick flat f2 r cowl'],
  ['Imogen', 'astronomer', 'Is never free on clear nights.', '30 e7 EN10 c2 h1 s2', 'fringe light beanie parka:light smile freckles f3'],
  ['Suleiman', 'tailor', 'Estimates inside leg at a glance. Keeps it private.', '56 e2 EN6/5 w2 sib', 'receding grey moustache round shirt:light pencil smile t1 f1 yoke'],
  ['Freya', 'ferry captain', 'Announces arrival at the supermarket.', '42 e4 EN9 c5 h2', 'ponytail light cap parka:dark smirk f2 r'],
  ['Jun', 'robotics technician', 'Says thank you to the vacuum.', '25 e3 EN8 c2 h1 s1', 'crop square hoodie:mid lanyard smile f1 coil'],
  ['Ottoline', 'taxidermist', 'The owl is not for sale and is not looking at you.', '49 e3 EN8 w2', 'long grey round blazer:mid monocle flat f3'],
  ['Dariusz', 'chimney sweep', 'Is invited to weddings for luck and stays for cake.', '37 e1 EN6 w2 o1', 'curly tophat stubble scarf:dark grin f1 r neckrings'],
  ['Seraphina', 'auctioneer', 'Orders coffee in under two seconds.', '35 e4 EN10/7 c2 h3 sp40', 'bob blazer:light necklace o t2 f3'],
  ['Milo', 'apprentice carpenter', 'Measures twice, cuts once, measures again to be sure.', '19 e1 EN8', 'fringe overalls:light pencil bandaid smile freckles'],
  ['Tova', 'ski-lift attendant', 'Has heard every chairlift joke. Laughs anyway.', '18 e1 EN9/5 sib', 'pigtails beanie parka:mid grin f1 r'],
  ['Evander', 'hot-air balloon pilot', 'Never knows where lunch will be.', '52 e3 EN9 c2 w2', 'crop grey handlebar scarf:light shades smile t2 f2'],
  ['Xanthe', 'mushroom forager', 'Will not say where. Do not ask.', '33 e0 EN5 w1', 'long strawhat plaid stern freckles f3 t1 cowl cloak'],
];
