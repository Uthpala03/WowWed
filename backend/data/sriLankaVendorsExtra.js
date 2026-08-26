/**
 * Extra Sri Lankan wedding vendors (vw-66 … vw-200) from public listings:
 * hotel wedding pages, Wikipedia, MyWed photographers, official jeweller/florist sites.
 */
function loc(name, city, district, type = 'branch') {
  return { name, city, district, type };
}

function usdLkr(usd) {
  return String(Math.round(Number(usd) * 300));
}

function photoQuotes(minUsd, maxUsd) {
  const min = usdLkr(minUsd);
  const max = usdLkr(maxUsd);
  return [
    { id: 'pre', title: 'Pre-shoot / engagement', price: min, details: 'Publicly listed starting rate converted to LKR. Confirm current packages with the studio.' },
    { id: 'wed', title: 'Wedding-day coverage', price: max, details: 'Typical full-day wedding rate from public listings (approx. LKR). Travel extra outside the home district.' },
  ];
}

function hall(name, city, district) {
  return loc(name, city, district, 'hall');
}

const VENUES = [
  ['Galle Face Hotel', 'Colombo', 'Colombo', '2000000-8000000', 'Iconic oceanfront heritage hotel. Grand Ballroom, octagonal Jubilee Ballroom and Chequerboard sunset terrace. 2026 wedding packages include suite stay, dressing room and bagpipers.', 'weddings@gallefacehotel.com', 'gallefacehotel.com', '2 Galle Face Terrace, Colombo 03', 'Galle_Face_Hotel', 4.8, 1, [hall('Grand Ballroom (250–280 pax)', 'Colombo', 'Colombo'), hall('Jubilee Ballroom (150–200 pax)', 'Colombo', 'Colombo'), hall('Chequerboard outdoor', 'Colombo', 'Colombo')]],
  ['Cinnamon Grand Colombo', 'Colombo', 'Colombo', '2500000-9000000', 'Five-star city hotel on Galle Road with large ballrooms and in-house catering for Kandyan and western weddings.', null, 'cinnamonhotels.com', '77 Galle Road, Colombo 03', 'Cinnamon_Grand_Colombo', 4.7, 1, [hall('Oak Room', 'Colombo', 'Colombo'), hall('Grand Ballroom', 'Colombo', 'Colombo')]],
  ['Cinnamon Lakeside Colombo', 'Colombo', 'Colombo', '2200000-8000000', 'Lakeside five-star hotel on Beira Lake with ballroom and lawn options for city weddings.', null, 'cinnamonhotels.com', '115 Sir Chittampalam A. Gardiner Mawatha, Colombo 02', 'Cinnamon_Lakeside_Colombo', 4.7, 1, [hall('Lotus Ballroom', 'Colombo', 'Colombo'), hall('Lake lawn', 'Colombo', 'Colombo')]],
  ['Shangri-La Colombo', 'Colombo', 'Colombo', '4000000-15000000', 'Luxury tower hotel on Galle Face Green. Large pillar-free ballrooms and ocean-view pre-function spaces.', null, 'shangri-la.com/colombo', '1 Galle Face, Colombo 02', 'Shangri-La_Colombo', 4.8, 1, [hall('Lotus Ballroom', 'Colombo', 'Colombo'), hall('Ocean pre-function', 'Colombo', 'Colombo')]],
  ['Hilton Colombo', 'Colombo', 'Colombo', '2500000-9000000', 'Long-standing five-star hotel beside Beira Lake with grand ballroom weddings and Hilton catering.', null, 'hilton.com', '2 Sir Chittampalam A. Gardiner Mawatha, Colombo 02', 'Hilton_Colombo', 4.7, 1, [hall('Grand Ballroom', 'Colombo', 'Colombo')]],
  ['The Kingsbury Colombo', 'Colombo', 'Colombo', '2500000-8500000', 'Oceanfront five-star hotel on Janadhipathi Mawatha with ballroom and rooftop options.', null, 'thekingsburyhotel.com', '48 Janadhipathi Mawatha, Colombo 01', 'The_Kingsbury', 4.7, 1, [hall('Grand Ballroom', 'Colombo', 'Colombo')]],
  ['Taj Samudra', 'Colombo', 'Colombo', '2200000-8000000', 'Taj hotel on Galle Face with sea-view lawns and ballrooms for destination and city weddings.', null, 'tajhotels.com', '25 Galle Face Centre Road, Colombo 03', 'Taj_Samudra', 4.7, 1, [hall('Crystal Ballroom', 'Colombo', 'Colombo'), hall('Sea-view lawn', 'Colombo', 'Colombo')]],
  ['Waters Edge', 'Battaramulla', 'Colombo', '1800000-7000000', 'Lakeside wedding destination in Battaramulla. Grand Ballroom for 350–750 guests plus Eagle, Jetty Green, Pavilion and lawns.', null, 'watersedge.lk', '316 Ethul Kotte Road, Battaramulla', 'Waters_Edge_(Sri_Lanka)', 4.8, 1, [hall('Grand Ballroom (350–750)', 'Battaramulla', 'Colombo'), hall('Eagle (250)', 'Battaramulla', 'Colombo'), hall('Jetty Green waterfront', 'Battaramulla', 'Colombo'), hall('Pavilion at the Edge', 'Battaramulla', 'Colombo')]],
  ['ITC Ratnadipa', 'Colombo', 'Colombo', '4000000-12000000', 'Luxury Collection hotel. Sangam Ballroom and Panorama Deck for large Colombo weddings.', null, 'itchotels.com', '89 Galle Face, Colombo 02', 'ITC_Ratnadipa', 4.8, 1, [hall('Sangam Ballroom', 'Colombo', 'Colombo'), hall('Panorama Deck', 'Colombo', 'Colombo')]],
  ['Mount Lavinia Hotel', 'Mount Lavinia', 'Colombo', '1500000-6000000', 'Colonial seaside hotel famous for terrace and beach weddings south of Colombo.', null, 'mountlaviniahotel.com', '100 Hotel Road, Mount Lavinia', 'Mount_Lavinia_Hotel', 4.7, 1, [hall('Governor\'s Wing / terrace', 'Mount Lavinia', 'Colombo'), hall('Beach / garden', 'Mount Lavinia', 'Colombo')]],
  ['Galadari Hotel', 'Colombo', 'Colombo', '1200000-4500000', 'City hotel opposite the World Trade Center with ballroom wedding packages.', null, 'galadarihotel.lk', '64 Lotus Road, Colombo 01', 'Galadari_Hotel', 4.5, 0, [hall('Grand Ballroom', 'Colombo', 'Colombo')]],
  ['Mövenpick Hotel Colombo', 'Colombo', 'Colombo', '2000000-7000000', 'Contemporary city hotel on Galle Road with rooftop and ballroom events.', null, 'movenpick.accor.com', '24 Sir Mohamed Macan Markar Mawatha, Colombo 03', 'Mövenpick_Hotel_Colombo', 4.6, 0, [hall('Ballroom', 'Colombo', 'Colombo')]],
  ['Marino Beach Colombo', 'Colombo', 'Colombo', '1500000-5000000', 'Beach-facing Colombo hotel with banquet halls for mid-to-large weddings.', null, 'marinobeachcolombo.com', '590 Marine Drive, Colombo 03', 'Marino_Beach_Colombo', 4.5, 0, [hall('Banquet hall', 'Colombo', 'Colombo')]],
  ['Cinnamon Red Colombo', 'Colombo', 'Colombo', '800000-3000000', 'Lifestyle hotel in Kollupitiya suited to smaller city receptions and after-parties.', null, 'cinnamonhotels.com', '59 Ananda Coomaraswamy Mawatha, Colombo 07', 'Cinnamon_Red_Colombo', 4.5, 0, [hall('Function rooms', 'Colombo', 'Colombo')]],
  ["Queen's Hotel Kandy", 'Kandy', 'Kandy', '800000-3500000', 'Heritage hotel beside Kandy Lake with Main and Mini ballrooms for hill-country weddings.', null, 'queenshotel.lk', 'Dalada Veediya, Kandy', "Queen's_Hotel,_Kandy", 4.6, 1, [hall('Main Ballroom', 'Kandy', 'Kandy'), hall('Mini Ballroom', 'Kandy', 'Kandy')]],
  ['Hotel Suisse Kandy', 'Kandy', 'Kandy', '700000-3000000', 'Colonial lake-view hotel in Kandy, popular for intimate and mid-size Kandyan weddings.', null, 'hotelsuisse.lk', '30 Sangaraja Mawatha, Kandy', 'Hotel_Suisse', 4.6, 0, [hall('Lake-view halls', 'Kandy', 'Kandy')]],
  ["Earl's Regency Hotel", 'Kandy', 'Kandy', '1200000-4500000', 'Hillside five-star hotel in Kundasale with grand ballroom and valley views.', null, 'earlsregency.lk', 'Earl\'s Road, Kundasale, Kandy', 'Earl%27s_Regency', 4.7, 1, [hall('Grand Ballroom', 'Kandy', 'Kandy')]],
  ['Mahaweli Reach Hotel', 'Kandy', 'Kandy', '1000000-4000000', 'River-view hotel north of Kandy town with banquet and garden wedding spaces.', null, 'mahaweli.com', '35 Pongoda Road, Kandy', 'Mahaweli_Reach_Hotel', 4.6, 0, [hall('Ballroom', 'Kandy', 'Kandy'), hall('Garden / river', 'Kandy', 'Kandy')]],
  ['Cinnamon Citadel Kandy', 'Kandy', 'Kandy', '1000000-4000000', 'Mahaweli-side Cinnamon hotel with ballroom and outdoor decks for Kandy weddings.', null, 'cinnamonhotels.com', '124 Srimath Kuda Ratwatte Mawatha, Kandy', 'Cinnamon_Citadel_Kandy', 4.6, 0, [hall('Citadel Ballroom', 'Kandy', 'Kandy')]],
  ['Amaya Hills Kandy', 'Kandy', 'Kandy', '900000-3500000', 'Hill hotel overlooking Kandy with banquet and outdoor wedding settings.', null, 'amayaresorts.com', 'Heerassagala, Kandy', 'Amaya_Hills', 4.6, 0, [hall('Banquet', 'Kandy', 'Kandy'), hall('Hill garden', 'Kandy', 'Kandy')]],
  ['Heritance Kandalama', 'Dambulla', 'Matale', '2000000-7000000', 'Geoffrey Bawa jungle-and-lake hotel. Destination weddings with dramatic architecture and nature backdrops.', null, 'heritancehotels.com', 'P.O. Box 11, Kandalama, Dambulla', 'Heritance_Kandalama', 4.8, 1, [hall('Conference / banquet', 'Dambulla', 'Matale'), hall('Lake / terrace', 'Dambulla', 'Matale')]],
  ['Jetwing Vil Uyana', 'Sigiriya', 'Matale', '2500000-8000000', 'Luxury dwelling hotel in wetlands near Sigiriya. Intimate destination and pre-shoot favourite.', null, 'jetwinghotels.com', 'Mahasen Trail, Sigiriya', 'Jetwing_Vil_Uyana', 4.8, 1, [hall('Pavilion / paddy views', 'Sigiriya', 'Matale')]],
  ['Aliya Resort & Spa', 'Sigiriya', 'Matale', '1500000-5000000', 'Safari-style resort near Sigiriya Rock with lawn and banquet weddings.', null, 'aliyaresort.com', 'Sigiriya', 'Aliya_Resort_and_Spa', 4.6, 0, [hall('Lawn', 'Sigiriya', 'Matale'), hall('Banquet', 'Sigiriya', 'Matale')]],
  ['Jetwing Lighthouse', 'Galle', 'Galle', '1800000-6500000', 'Bawa-designed clifftop hotel in Galle. Ocean-view destination weddings on the south coast.', null, 'jetwinghotels.com', 'Dadella, Galle', 'Jetwing_Lighthouse', 4.8, 1, [hall('Ballroom', 'Galle', 'Galle'), hall('Clifftop / ocean terrace', 'Galle', 'Galle')]],
  ['Amangalla', 'Galle', 'Galle', '4000000-12000000', 'Aman hotel inside Galle Fort. Ultra-luxury intimate weddings in colonial courtyards.', null, 'aman.com', '10 Church Street, Galle Fort', 'Amangalla', 4.9, 1, [hall('Fort courtyard', 'Galle', 'Galle')]],
  ['Fort Bazaar', 'Galle', 'Galle', '1500000-5000000', 'Boutique hotel in Galle Fort for small destination weddings and dinners.', null, 'teardrop-hotels.com', '26 Church Street, Galle Fort', 'Fort_Bazaar', 4.7, 0, [hall('Courtyard / dining', 'Galle', 'Galle')]],
  ['Tamarind Hill', 'Galle', 'Galle', '1200000-4000000', 'Colonial bungalow hotel near Galle for garden and veranda weddings.', null, 'tamarindhill.lk', 'Galle', 'Tamarind_Hill_Hotel', 4.6, 0, [hall('Garden', 'Galle', 'Galle')]],
  ['Cape Weligama', 'Weligama', 'Matara', '4000000-12000000', 'Clifftop Relais & Châteaux resort. Destination weddings overlooking the Indian Ocean.', null, 'capeweligama.com', 'Kangaarakanda Estate, Weligama', 'Cape_Weligama', 4.9, 1, [hall('Cliff lawn', 'Weligama', 'Matara')]],
  ['Shangri-La Hambantota', 'Hambantota', 'Hambantota', '2500000-9000000', 'Resort on the south-east coast with ballroom and beach wedding settings.', null, 'shangri-la.com/hambantota', 'Sittrakala Watta, Chithragala, Hambantota', 'Shangri-La_Hambantota', 4.7, 1, [hall('Ballroom', 'Hambantota', 'Hambantota'), hall('Beach / garden', 'Hambantota', 'Hambantota')]],
  ['Anantara Peace Haven Tangalle', 'Tangalle', 'Hambantota', '3000000-10000000', 'Clifftop Anantara resort for luxury beach and garden destination weddings.', null, 'anantara.com', 'Goyambokka Estate, Tangalle', 'Anantara_Peace_Haven_Tangalle_Resort', 4.8, 1, [hall('Ocean lawn', 'Tangalle', 'Hambantota')]],
  ['Cinnamon Bey Beruwala', 'Beruwala', 'Kalutara', '1500000-5500000', 'West-coast Cinnamon resort with beach, garden and banquet wedding options.', null, 'cinnamonhotels.com', 'Moragalla, Beruwala', 'Cinnamon_Bey_Beruwala', 4.6, 0, [hall('Ballroom', 'Beruwala', 'Kalutara'), hall('Beach', 'Beruwala', 'Kalutara')]],
  ['Cinnamon Bentota Beach', 'Bentota', 'Galle', '1800000-6000000', 'Geoffrey Bawa beach hotel in Bentota for seaside receptions.', null, 'cinnamonhotels.com', 'National Holiday Resort, Bentota', 'Cinnamon_Bentota_Beach', 4.7, 1, [hall('Beach / banquet', 'Bentota', 'Galle')]],
  ['Taj Bentota Resort & Spa', 'Bentota', 'Galle', '2000000-7000000', 'Taj beach resort in Bentota with ocean-view wedding lawns.', null, 'tajhotels.com', 'National Holiday Resort, Bentota', 'Taj_Bentota_Resort_&_Spa', 4.7, 0, [hall('Ocean lawn', 'Bentota', 'Galle')]],
  ['Saman Villas', 'Bentota', 'Galle', '2500000-8000000', 'Clifftop boutique resort between Bentota and Induruwa for intimate destination weddings.', null, 'samanvilla.com', 'Aturuwella, Bentota', 'Saman_Villas', 4.8, 0, [hall('Cliff pavilion', 'Bentota', 'Galle')]],
  ['Jetwing Blue', 'Negombo', 'Gampaha', '1200000-4500000', 'Beach resort in Negombo with banquet and garden weddings close to the airport.', null, 'jetwinghotels.com', 'Porutota Road, Negombo', 'Jetwing_Blue', 4.6, 0, [hall('Ballroom', 'Negombo', 'Gampaha'), hall('Beach garden', 'Negombo', 'Gampaha')]],
  ['Jetwing Beach', 'Negombo', 'Gampaha', '1200000-4500000', 'Adult-oriented Jetwing hotel on Negombo beach for boutique receptions.', null, 'jetwinghotels.com', 'Porutota Road, Negombo', 'Jetwing_Beach', 4.6, 0, [hall('Beach / banquet', 'Negombo', 'Gampaha')]],
  ['Grand Hotel Nuwara Eliya', 'Nuwara Eliya', 'Nuwara Eliya', '1000000-4000000', 'Colonial hill hotel on the golf course. Cool-climate weddings and homecomings.', null, 'tangerinehotels.com', 'Grand Hotel Road, Nuwara Eliya', 'Grand_Hotel_(Nuwara_Eliya)', 4.7, 1, [hall('Ballroom', 'Nuwara Eliya', 'Nuwara Eliya'), hall('Garden', 'Nuwara Eliya', 'Nuwara Eliya')]],
  ['Heritance Tea Factory', 'Nuwara Eliya', 'Nuwara Eliya', '1500000-5000000', 'Converted tea factory hotel in Kandapola. Unique hill-country destination weddings.', null, 'heritancehotels.com', 'Kandapola, Nuwara Eliya', 'Heritance_Tea_Factory', 4.8, 1, [hall('Factory / garden', 'Nuwara Eliya', 'Nuwara Eliya')]],
  ['Araliya Green Hills', 'Nuwara Eliya', 'Nuwara Eliya', '800000-3000000', 'Hill hotel in Nuwara Eliya with banquet halls for cooler-climate receptions.', null, 'araliya.lk', 'Nuwara Eliya', 'Araliya_Green_Hills_Hotel', 4.5, 0, [hall('Banquet', 'Nuwara Eliya', 'Nuwara Eliya')]],
  ['Uga Bay', 'Pasikudah', 'Batticaloa', '1800000-6000000', 'East-coast beach resort in Pasikudah for destination weddings on the calm bay.', null, 'ugaescapes.com', 'Pasikudah', 'Uga_Bay', 4.7, 0, [hall('Beach / pavilion', 'Pasikudah', 'Batticaloa')]],
  ['Amaya Beach Passikudah', 'Pasikudah', 'Batticaloa', '1200000-4500000', 'Beach resort on the east coast with lawn and banquet wedding setups.', null, 'amayaresorts.com', 'Passikudah', 'Amaya_Beach_Passikudah', 4.5, 0, [hall('Beach lawn', 'Pasikudah', 'Batticaloa')]],
  ['Cinnamon Lodge Habarana', 'Habarana', 'Anuradhapura', '1200000-4500000', 'Jungle-lodge style hotel for Cultural Triangle destination weddings.', null, 'cinnamonhotels.com', 'Habarana', 'Cinnamon_Lodge_Habarana', 4.6, 0, [hall('Garden / banquet', 'Habarana', 'Anuradhapura')]],
  ['The Golden Crown Hotel', 'Kandy', 'Kandy', '900000-3500000', 'Kandy city hotel with banquet facilities for Kandyan weddings.', null, 'goldencrown.lk', 'Kandy', 'The_Golden_Crown', 4.5, 0, [hall('Ballroom', 'Kandy', 'Kandy')]],
  ['Oak Ray Regency', 'Kandy', 'Kandy', '600000-2500000', 'City hotel in Kandy used for mid-size wedding receptions.', null, 'oakrayhotels.com', 'Kandy', 'Oak_Ray_Regency', 4.4, 0, [hall('Banquet', 'Kandy', 'Kandy')]],
  ['Berjaya Hotel Colombo', 'Mount Lavinia', 'Colombo', '800000-3000000', 'Hilltop hotel above Mount Lavinia with sea views and banquet weddings.', null, 'berjayahotel.com', '36 College Avenue, Mount Lavinia', 'Berjaya_Hotel_Colombo', 4.4, 0, [hall('Banquet', 'Mount Lavinia', 'Colombo')]],
  ['Fairway Colombo', 'Colombo', 'Colombo', '1000000-4000000', 'Colombo city hotel with function rooms for receptions and homecomings.', null, 'fairwaycolombo.com', 'Colombo', 'Fairway_Colombo', 4.4, 0, [hall('Function rooms', 'Colombo', 'Colombo')]],
  ['OZO Colombo', 'Colombo', 'Colombo', '700000-2500000', 'Lifestyle hotel on Marine Drive for smaller city celebrations.', null, 'ozohotels.com', '36-38 Galle Face Terrace, Colombo 03', 'OZO_Colombo', 4.4, 0, [hall('Event space', 'Colombo', 'Colombo')]],
  ['Weligama Bay Marriott Resort', 'Weligama', 'Matara', '2500000-8000000', 'Marriott resort on Weligama Bay with ballroom and beach wedding packages.', null, 'marriott.com', 'Weligama', 'Weligama_Bay_Marriott_Resort', 4.6, 0, [hall('Ballroom', 'Weligama', 'Matara'), hall('Bay beach', 'Weligama', 'Matara')]],
  ['Anantara Kalutara Resort', 'Kalutara', 'Kalutara', '2000000-7000000', 'River-mouth and ocean resort in Kalutara for luxury west-coast weddings.', null, 'anantara.com', 'Kalutara', 'Anantara_Kalutara_Resort', 4.7, 1, [hall('River / ocean lawn', 'Kalutara', 'Kalutara')]],
  ['City of Dreams / Cinnamon Life', 'Colombo', 'Colombo', '3000000-12000000', 'New integrated city resort on the Beira waterfront for large contemporary Colombo weddings.', null, 'cinnamonlife.com', 'Colombo 02', 'Cinnamon_Life', 4.6, 1, [hall('Ballrooms', 'Colombo', 'Colombo')]],
];

const PHOTOGRAPHERS = [
  ['Jethro Rathnayake', 'Colombo', 'Colombo', 110, 300, 'Documentary wedding photographer. Natural light and cinematic storytelling. Public listing on MyWed.', '+94 71 488 5280', null, 'jethrorathnayake.com', 'Colombo', 'https://img.mywed.com/fUADrLIiOShl12gdIS_S41OV16XHiIOM0FZC-h5hJaSupgPDzQ-XKf1T2vlbArdjhGPgyFb6cqKd1j4O4vbI4FSvrQ4iByxZhjSeMZg', 4.8, 1],
  ['Ceylon Paradise Photography', 'Galle', 'Galle', 108, 215, 'Rasindu Jayan. South-coast wedding stories and destination coverage.', '+94 76 854 9361', null, null, 'Galle', 'https://img.mywed.com/8GK2QmNfFHDWNNyYSeDXI1ZS3RXxY6udmngS1WypIM3DGOjzn3dXkObQsq1Ty7iHN1ED3iZwn5gjJ9CMt-cGzUQaCau9fh60LOZUXw', 4.7, 0],
  ['Yarara Photography', 'Galle', 'Galle', 140, 320, 'Chamalka Srimal. Fine-art and documentary weddings against south-coast landscapes.', '+94 76 767 4493', null, null, 'Galle', 'https://img.mywed.com/Qj32HlAm615wEzET9KD7kYfm-qqpezYU_ndYwXc5TbwUzTWXVKUQtlV6CTGw29hkOeMdWFbesUkjHgyu6FHTlxdzs0SNpw56dsR-RWo', 4.7, 0],
  ['Madush Malpathi Photography', 'Colombo', 'Colombo', 83, 200, 'Poetic, candid wedding photography based in Colombo.', '+94 75 581 5217', null, null, 'Colombo', 'https://img.mywed.com/AUorjMuVE0VIbUkolI5knbvYkNAI7NfqNujPF_FRPw_RmQygOMk94o9Dc0SW_FjJPvDGBHfjV4rd4erQ2hQ0nLhu_smV7P26Di1uHg', 4.6, 0],
  ['The Ceylon Bliss', 'Galle', 'Galle', 108, 215, 'Enoch Balasooriya. Destination wedding films and photos from the south. theceylonbliss.com', '+94 77 938 9174', null, 'theceylonbliss.com', 'Galle', 'https://img.mywed.com/kD9TyND6ajgJH0VdZwRMYDS0FQuBCFNzWE-m3HUhhrACTqkCm3snZkxyMqj1mANG9iJtUGzsW3gH8RGZDaCOwtQFVXkSRmdlSXnPqQ', 4.7, 0],
  ['D Squared Portraiture', 'Colombo', 'Colombo', 108, 250, 'Diniru Abeysuriya. Fine-art wedding team in Colombo.', '+94 70 686 5946', null, null, 'Colombo', 'https://img.mywed.com/FUc2vZNsvvrT_MabpIZ18WoxLoS-KR7x1dlRkNt3k6M2IUqYlagum-8p53PLnFH1VBsI0YXhTq4muSUc0Zpe9N0VGU3q6tS7a2ZLpw', 4.6, 0],
  ['A Lasting Impression LK', 'Colombo', 'Colombo', 75, 185, 'Kanishka M. Documentary-style weddings capturing candid emotion.', '+94 76 552 4558', null, null, 'Colombo', 'https://img.mywed.com/xFgDz87ihmLfCdDfWwJaVRvM1eMHbawNMPqerHCpxv3XPTyVBqD-jTuTXf7GdvA3LDH9VC7q0rxmKfJ-nztaF5H1Rj-K0FyC6KZvdY0', 4.6, 0],
  ['Lewmini Muthukumara Photography', 'Matara', 'Matara', 80, 270, 'Emotive, romantic wedding photography from Matara. Covers the south.', '+44 7307 046500', null, null, 'Matara', 'https://img.mywed.com/sNQdG1sPPUm_lPBKeIpcbx3H-5JACqjkpKsWoS8RwZP-sUSqyIHVGsW8UlQMXHtW_AZLsdtdhI1wUgLehpkgWWE1vvIBkyKcu5e5jw', 4.6, 0],
  ['Pamod Nilru Photography', 'Colombo', 'Colombo', 121, 245, 'Elegant, classically styled wedding photography.', '+94 71 725 2854', null, null, 'Colombo', 'https://img.mywed.com/WgMHHB14aAkfpbAHZJumPi4NsAITnfW9XtJ0dNOBF35Q0pqUrb_m5sT2UGoe0FiIP-EcJNniFrgMuZ5bAZ5yUyzjzGHxsDoEuSud3p8', 4.7, 0],
  ['Geeshan Bandara Photography', 'Colombo', 'Colombo', 329, 400, 'International award-winning storyteller. 12+ years, celebrity to intimate weddings across Asia and Europe.', '+94 77 345 1983', null, null, 'Colombo', 'https://img.mywed.com/QnxWc18tl41QcCVskja6KFtKlq1CmGLOWQqQ4iQbIF_j8FIvSD7c_W1dN-54_ESMJArAHcXP50cO7Ehek46rXzO0hRTWYA3dxH3ofQ', 4.9, 1],
  ['Revival Ridge', 'Colombo', 'Colombo', 119, 430, 'Charith Kodagoda. Elopement and documentary wedding photographer.', '+94 76 865 1588', null, null, 'Colombo', 'https://img.mywed.com/CUuThhLJioHpTIxt-NVA5vXEq5OuiTYeeEOJ5YD0LaXq-hhGYL9AcooRCevnZ5vdQaEHcVYjcwyuhVyFp1JfCCur_WPiR-XFIndjJ00', 4.7, 0],
  ['Ravizgraphy', 'Matara', 'Matara', 113, 155, 'Ravi Ish. Weddings, portraits and cinematic lifestyle from the south.', '+94 76 305 6168', null, null, 'Matara', 'https://img.mywed.com/aabw7MTLlwDaz1Ye6Y3GB6HOFRVOsHbzI7BnjS_CI2EoVolWtNsjZiOde4Q_5s8K32bk5tmKFQJ5dBBps-mxLwal7_9KOepYCzo2IVo', 4.6, 0],
  ['Photo Banu', 'Jaffna', 'Jaffna', 61, 155, 'Banu Shanth. Jaffna-based, island-wide coverage blending candid emotion with Tamil wedding tradition.', '+94 77 281 1999', null, null, 'Jaffna', 'https://img.mywed.com/X8VTVY3AapqioTdX9g7tw69ebLKfMYYGFuvd4feAghiJSCiCxvEHp-RlyTlblmhzaIbCuiV6lobgN8QEvNu1o7wddGFZrgnAkBRo', 4.7, 1],
  ['Elia Davide Photography', 'Colombo', 'Colombo', 65, 130, 'Friendly, documentary wedding photographer based in Sri Lanka.', '+94 77 963 1081', null, null, 'Colombo', 'https://img.mywed.com/F9undj2sfO_OKTiVfKGnl67Pyh1jWXj6baaPe7nFewDHcnBRX5MDU8dHfRSGtt6Jb-eiXIXpDUKKwkUd1si6RquDOd1IsgqHvQCDK0U', 4.5, 0],
  ['Akalanka Kandanearachchi', 'Colombo', 'Colombo', 193, 250, 'Colombo wedding photographer listed on MyWed.', '+94 77 241 0210', null, null, 'Colombo', 'https://img.mywed.com/IqVrp1LwuzfEfoAqC2aeW38Re4XtrGfKcm8RgbpNP-QRjJEOYBaL5xaVE3FgeAuRS0riEAWP6EsEPhsRe_crIk7op180hateIxbdvg', 4.6, 0],
  ['DR Creations', 'Colombo', 'Colombo', 150, 400, 'Dinesh & Ruwanthie Wanigarathna. Award-winning light-and-airy husband-and-wife team since 2011. drcreations.lk', '+94 72 877 1644', null, 'drcreations.lk', 'Colombo', 'https://img.mywed.com/f8aPYCtXFUDTmdcrWhTzGf2Pj-dBMNO9TTLlfJC8-AMMLiship5y6d-Q0LzMCr60kV9lt2xLHmUP8IwUKETloXnGc7w0598p8h7N', 4.9, 1],
  ['Enamour Studio', 'Colombo', 'Colombo', 80, 250, 'Chiranjaya Samal. Lifestyle and fine-art wedding photography.', '+94 77 715 0011', null, null, 'Colombo', 'https://img.mywed.com/_kW3W_whXUwT3hrfYQKjOo_PXim6EqXAfXi-Qxmzxl5wWEqbq01uRlfi9V9IWs3mrr02BTH1h93W_BjkvN0hbbowjt2J_S1iy5w7Pvo', 4.6, 0],
  ['Sampath Palliyaguruge Photography', 'Colombo', 'Colombo', 117, 250, 'Wedding photography, cinematography and pre-shoots. 2026 bookings open.', '+94 77 756 5365', null, null, 'Colombo', 'https://img.mywed.com/PCF9RQClvHoIPyMYJ3BXAT-ku6cC26mO5NpWrIWWlBe8gmA8lp7dqToUFt85INP5pvYoWyJPGDphP2QV9aDxQkniLwjScfDKIm0G', 4.6, 0],
  ['Sasika Boralessa Photography', 'Galle', 'Galle', 61, 155, 'Galle-based wedding photographer covering south-coast celebrations.', '+94 71 891 6065', null, null, 'Galle', 'https://img.mywed.com/jnhzGRMm5WUFe3QyZ8EnYBkrgZEqByS6NYr2XuH8Oo2syGePnYFihrVGfoiVWBvTp-pYKBH1wzV6WN44IND7h-MZF4Z47TeJ3a5oRQ', 4.5, 0],
  ['Perfect Scenario', 'Bandarawela', 'Badulla', 100, 200, 'John Charles Dilsara. Natural storytelling from Uva / Bandarawela, 6+ years.', '+94 74 310 0977', null, null, 'Bandarawela', 'https://img.mywed.com/6EYjlhWmW_LdneFhOf5U237Tx34R0dJ1pjafy4_b4GRqmtEL9Wdh_r77sKA2sQ2z3urWPglCiXscUYQjtKeO9rGLt6_zPUjQ4FBp', 4.6, 0],
  ['Buddhika Photography', 'Colombo', 'Colombo', 120, 250, 'Wedding, portrait and landscape photographer aiming for dramatic frames.', '+94 77 260 0658', null, null, 'Colombo', 'https://img.mywed.com/7fyyBnJxfD2lYumsQypI3hu2QSyhJtD8oL5SubNbJtyVgBSDTx8Zfc1YdTT7TwhWa4CgdNOAEmvB9t9dGfeQ7UVfNhEyQjgPWLjo5A', 4.6, 0],
  ['Birendra Fernando Photography', 'Colombo', 'Colombo', 83, 170, 'Wedding, event and fashion photographer.', '+94 77 469 9299', null, null, 'Colombo', 'https://img.mywed.com/CH2zv0OaAZEJYcnxINxYRIAKDCA3abUu3FzUfyKg8vu6K9VKdhmlkrDK6VIWx7UT6nYHqnLyawvixdu80zUTYVN0h9X_mp8r5_xp', 4.6, 0],
  ['Pixgeek', 'Colombo', 'Colombo', 100, 200, 'Thusara Dilshan. Lifestyle and fine-art wedding photography company.', '+94 76 572 1024', null, null, 'Colombo', 'https://img.mywed.com/S1vNZUpaGKaWG7zQ0dPWvqTqbzg0RLxJ-LMA86iPlM4CX6Ybe9J9L78DRLyg4-OCxTXAIPpsmGKCJC-S7lhJVFLEWT0_Xi8hV4xpBA', 4.6, 0],
  ['Tai Hsin Shiek Photography', 'Colombo', 'Colombo', 91, 200, 'Warm, humorous wedding photo catcher based in Colombo.', '+94 77 351 7648', null, null, 'Colombo', 'https://img.mywed.com/AkWaJROquLG7wXjiCK60SqhzIFHaNUC5Oc50wcDDuj4Bk8fg9RZTenDFGY-D_9O8RWLsiqO1YgkOtK7EKsk5vfBym7BkfgpIm6EUEA', 4.5, 0],
  ['Yavinda Gayan Photography', 'Colombo', 'Colombo', 106, 200, 'Colombo wedding photographer listed on MyWed.', '+94 77 165 5042', null, null, 'Colombo', 'https://img.mywed.com/rTw1WZJqri6VOUOWjUhqqxd7h_pd8MPu2Kxa29RIbh34GB6zmQj1SdE4fZt9KBgH9z3mBfuea9UNDmcIcrBvgt0zTm819PPnYZtMaYk', 4.5, 0],
  ['Shan Liyanage Photography', 'Kandy', 'Kandy', 60, 120, 'Kandy-based wedding photographer covering hill-country and island-wide events.', '+94 77 866 4015', null, null, 'Kandy', 'https://img.mywed.com/9bFTCcXb2B4y1va80uPH4ho1fFcLZOb1od8onDmhgGyxbPE156__pHXy2s5ZVgnfrBlETyY-F3E0LpwQLtv1RMGE_8aXuHO_pfu2Gfk', 4.6, 0],
  ['VOWS Fine Art Wedding Studio', 'Colombo', 'Colombo', 150, 400, 'Fine-art studio. Sincere light, albums and enlargements. vowsweddings.com', null, null, 'vowsweddings.com', 'Colombo', null, 4.8, 1],
  ['Studio Cloudy', 'Colombo', 'Colombo', 150, 400, 'Ramith & Adishika De Silva. 10 years of relaxed Colombo wedding photography. studiocloudy.com', null, null, 'studiocloudy.com', 'Colombo', null, 4.8, 1],
  ['Studio 90', 'Colombo', 'Colombo', 120, 350, 'Island-wide photo and video including Tamil / Hindu weddings. studio90.lk', '+94 76 233 9990', 'Studio90lk@gmail.com', 'studio90.lk', 'Colombo', null, 4.7, 0],
  ['WEDDZ Studio', 'Colombo', 'Colombo', 100, 300, 'Colombo wedding photography and cinematography studio listed among Sri Lanka wedding photographers.', null, null, null, 'Colombo', null, 4.5, 0],
];

const JEWELLERY = [
  ['Mallika Hemachandra Jewellers', 'Colombo 07', 'Colombo', '100000-5000000', 'Legendary jeweller since 1968. Custom bridal sets at Horton Place, Nugegoda and Kandy City Centre plus mall branches.', '+94 11 268 8531', null, 'mallikahemachandra.com', '81/1 Horton Place, Colombo 07', 4.8, 1, [
    loc('Horton Place bridal studio', 'Colombo 07', 'Colombo'),
    loc('Nugegoda', 'Nugegoda', 'Colombo'),
    loc('Kandy City Centre', 'Kandy', 'Kandy'),
    loc('Crescat Boulevard', 'Colombo 03', 'Colombo'),
    loc('Liberty Plaza', 'Colombo 03', 'Colombo'),
    loc('Majestic City', 'Colombo 04', 'Colombo'),
    loc('K-Zone Ja-Ela', 'Ja-Ela', 'Gampaha'),
    loc('Ward City Gampaha', 'Gampaha', 'Gampaha'),
  ]],
  ['Colombo Jewellery Stores', 'Colombo', 'Colombo', '80000-3000000', 'Heritage Colombo jeweller for bridal gold, diamonds and traditional Kandyan sets.', null, null, null, 'Colombo', 4.6, 0, [loc('Colombo showroom', 'Colombo', 'Colombo')]],
  ['Vogue Jewellers', 'Colombo', 'Colombo', '100000-4000000', 'National jewellery chain with bridal collections and showrooms around the island.', null, null, 'voguejewellers.lk', 'Colombo', 4.6, 1, [loc('Colombo', 'Colombo', 'Colombo'), loc('Kandy', 'Kandy', 'Kandy'), loc('Galle', 'Galle', 'Galle'), loc('Kurunegala', 'Kurunegala', 'Kurunegala')]],
  ['Prestige Jewellers', 'Colombo', 'Colombo', '80000-2500000', 'Colombo jeweller known for bridal gold and diamond sets.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Zam Gems', 'Colombo', 'Colombo', '150000-5000000', 'Sri Lankan gem and jewellery house. Sapphires, bridal sets and export-quality stones.', null, null, 'zamgems.com', 'Colombo', 4.7, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Sifani Jewellers', 'Colombo', 'Colombo', '100000-3000000', 'Contemporary jewellery boutique for wedding bands and bridal sets.', null, null, 'sifani.com', 'Colombo', 4.6, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Siri Kirula Kandy', 'Kandy', 'Kandy', '50000-1500000', 'Kandyan bridal jewellery for sale and rent. Traditional necklaces, brooches and headpieces.', null, null, 'sirikirulakandy.lk', 'Kandy', 4.7, 1, [loc('Kandy showroom', 'Kandy', 'Kandy')]],
  ['Kandy Queen Jewellery', 'Pannipitiya', 'Colombo', '40000-800000', 'Kandyan jewellery design and rental. 8/445 Highlevel Road, Makumbura, Kottawa.', '077 936 9506 / 077 119 0381', 'kandyanbridaljewellery@gmail.com', 'kandyanbridaljewellery.lk', '8/445 Highlevel Road, Makumbura, Kottawa', 4.6, 0, [loc('Kottawa showroom', 'Pannipitiya', 'Colombo')]],
  ['Damsa Jewellers', 'Colombo', 'Colombo', '60000-2000000', 'Colombo jeweller for gold bridal sets and wedding rings.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Stone \'N String', 'Colombo', 'Colombo', '80000-2500000', 'Designer jewellery studio for modern bridal pieces and custom rings.', null, null, null, 'Colombo', 4.6, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Lara Jewellers', 'Colombo', 'Colombo', '50000-1500000', 'Bridal gold and costume jewellery for Kandyan and Indian weddings.', null, null, null, 'Colombo', 4.4, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Nana Jewellers', 'Colombo', 'Colombo', '80000-2500000', 'Established Colombo jeweller for traditional bridal gold.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
];

const BRIDAL = [
  ['Ramani Fernando Salons', 'Colombo', 'Colombo', '40000-250000', 'Leading Sri Lankan salon group for bridal hair, makeup and Kandyan dressing. Multiple Colombo salons.', null, null, 'ramanifernando.com', 'Colombo', 4.7, 1, [loc('Colombo salons', 'Colombo', 'Colombo')]],
  ['Salon Nayana', 'Colombo', 'Colombo', '50000-200000', 'Well-known Colombo bridal salon for traditional Kandyan dressing, hair and makeup.', null, null, null, 'Colombo', 4.6, 1, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Salon Bonitha', 'Colombo', 'Colombo', '40000-180000', 'Bridal makeup and hair studio serving Colombo weddings.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Geethanjali Bridal', 'Colombo', 'Colombo', '60000-250000', 'Kandyan bridal dressing, jewellery styling and osariya draping.', null, null, null, 'Colombo', 4.6, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Salon Citrine', 'Colombo', 'Colombo', '35000-150000', 'Contemporary bridal hair and makeup for western and fusion weddings.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['The Bridal Lounge', 'Colombo', 'Colombo', '40000-180000', 'Bridal styling studio for makeup trials, hair and dressing-day teams.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Salon Shavendra', 'Kandy', 'Kandy', '30000-150000', 'Kandy bridal salon for Kandyan dressing and wedding makeup.', null, null, null, 'Kandy', 4.5, 0, [loc('Kandy', 'Kandy', 'Kandy')]],
  ['Janet Salon', 'Colombo', 'Colombo', '35000-160000', 'Colombo salon offering bridal packages and bridesmaid styling.', null, null, null, 'Colombo', 4.4, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Kandyan Bridal Studio', 'Kandy', 'Kandy', '40000-200000', 'Specialist Kandyan osariya dressing and traditional jewellery styling in Kandy.', null, null, null, 'Kandy', 4.6, 0, [loc('Kandy', 'Kandy', 'Kandy')]],
  ['Silk Route Bridal', 'Colombo', 'Colombo', '30000-200000', 'Saree draping, reception gowns and bridal trials in Colombo.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Tidbits Bridal', 'Colombo', 'Colombo', '25000-120000', 'Boutique bridal makeup and hair for intimate Colombo weddings.', null, null, null, 'Colombo', 4.4, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Osariya House', 'Kandy', 'Kandy', '20000-120000', 'Kandyan saree hire and dressing assistance for brides and family.', null, null, null, 'Kandy', 4.5, 0, [loc('Kandy', 'Kandy', 'Kandy')]],
];

const GROOM = [
  ['Hameedia', 'Colombo', 'Colombo', '25000-250000', 'Sri Lanka\'s well-known menswear house. Wedding suits, national dress and island-wide fittings.', null, null, 'hameedia.com', 'Colombo', 4.7, 1, [loc('Colombo', 'Colombo', 'Colombo'), loc('Kandy', 'Kandy', 'Kandy'), loc('Galle', 'Galle', 'Galle'), loc('Kurunegala', 'Kurunegala', 'Kurunegala'), loc('Negombo', 'Negombo', 'Gampaha')]],
  ['Odel Menswear', 'Colombo', 'Colombo', '20000-150000', 'Contemporary groomswear and accessories at Odel stores.', null, null, 'odel.lk', 'Alexandra Place, Colombo 07', 4.5, 0, [loc('Odel Colombo 07', 'Colombo 07', 'Colombo'), loc('Odel Ward Place', 'Colombo 07', 'Colombo')]],
  ['Spring & Summer', 'Colombo', 'Colombo', '25000-180000', 'Tailored suits and sherwanis for grooms in Colombo.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Nolimit', 'Colombo', 'Colombo', '15000-80000', 'Island-wide fashion retailer for groomsmen outfits and accessories.', null, null, 'nolimit.lk', 'Colombo', 4.4, 0, [loc('Colombo', 'Colombo', 'Colombo'), loc('Kandy', 'Kandy', 'Kandy'), loc('Galle', 'Galle', 'Galle'), loc('Kurunegala', 'Kurunegala', 'Kurunegala')]],
  ['Cool Planet', 'Colombo', 'Colombo', '12000-60000', 'Casual-to-smart groomsmen looks from a national fashion chain.', null, null, 'coolplanet.lk', 'Colombo', 4.3, 0, [loc('Island-wide stores', 'Colombo', 'Colombo')]],
  ['Kelly Felder Men', 'Colombo', 'Colombo', '20000-120000', 'Fashion retailer with groomswear and wedding-guest outfits.', null, null, 'kellyfelder.com', 'Colombo', 4.4, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Mandarin Colombo', 'Colombo', 'Colombo', '30000-200000', 'Bespoke tailoring for wedding suits and national dress.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Nilame Dress Hire', 'Kandy', 'Kandy', '15000-80000', 'Traditional nilame and groomsmen costume hire for Kandyan weddings.', null, null, null, 'Kandy', 4.6, 0, [loc('Kandy', 'Kandy', 'Kandy')]],
];

const FLORAL = [
  ['Lassana Flora', 'Colombo', 'Colombo', '40000-800000', 'Sri Lanka\'s best-known florist. Wedding flowers, poruwa, settee and hotel relationships island-wide.', null, null, 'lassanaflora.com', 'Colombo', 4.8, 1, [loc('Colombo', 'Colombo', 'Colombo'), loc('Kandy', 'Kandy', 'Kandy'), loc('Galle', 'Galle', 'Galle'), loc('Negombo', 'Negombo', 'Gampaha')]],
  ['CFL Colombo Florist', 'Colombo', 'Colombo', '30000-500000', 'City florist for bridal bouquets, church flowers and banquet tables.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Tropiflora', 'Colombo', 'Colombo', '50000-600000', 'Premium tropical floral design for hotels and destination weddings.', null, null, null, 'Colombo', 4.6, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Nuwara Eliya Flower Centre', 'Nuwara Eliya', 'Nuwara Eliya', '25000-400000', 'Hill-country blooms for cool-climate weddings and Colombo deliveries.', null, null, null, 'Nuwara Eliya', 4.6, 0, [loc('Nuwara Eliya', 'Nuwara Eliya', 'Nuwara Eliya')]],
  ['Blooming Affair', 'Colombo', 'Colombo', '35000-450000', 'Wedding stylist for poruwa, entrance and table flowers.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Ceylon Blooms', 'Colombo', 'Colombo', '30000-400000', 'Bridal bouquets, car decorations and banquet florals.', null, null, null, 'Colombo', 4.4, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Petals & Stems LK', 'Colombo', 'Colombo', '25000-350000', 'Contemporary floral studio for intimate and hotel weddings.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Interflora Sri Lanka', 'Colombo', 'Colombo', '20000-300000', 'Network florist for wedding-day deliveries across districts.', null, null, null, 'Colombo', 4.4, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Galle Fort Flowers', 'Galle', 'Galle', '30000-400000', 'South-coast wedding flowers for Galle Fort and beach venues.', null, null, null, 'Galle', 4.5, 0, [loc('Galle', 'Galle', 'Galle')]],
  ['Kandy Floral Studio', 'Kandy', 'Kandy', '25000-350000', 'Kandyan poruwa, nilame mal and temple-flower styling in Kandy.', null, null, null, 'Kandy', 4.5, 0, [loc('Kandy', 'Kandy', 'Kandy')]],
];

const CATERERS = [
  ['Fab', 'Colombo', 'Colombo', '80000-1500000', 'Popular Sri Lankan restaurant-caterer for homecomings, engagements and outdoor weddings.', null, null, null, 'Colombo', 4.6, 1, [loc('Colombo kitchens', 'Colombo', 'Colombo')]],
  ['Dinemore Catering', 'Colombo', 'Colombo', '50000-800000', 'Casual-to-buffet catering for mid-size wedding functions.', null, null, 'dinemore.lk', 'Colombo', 4.4, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Keells Catering', 'Colombo', 'Colombo', '100000-2000000', 'Retail-group catering for large family weddings and corporate-style buffets.', null, null, 'keellssuper.com', 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Sen Saal Catering', 'Colombo', 'Colombo', '40000-600000', 'Sri Lankan rice-and-curry and banquet menus for home and hall functions.', null, null, null, 'Colombo', 4.4, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Chinese Dragon Cafe Catering', 'Colombo', 'Colombo', '80000-1200000', 'Long-running Colombo Chinese restaurant with wedding banquet catering.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['The Commons Collective Events', 'Colombo', 'Colombo', '60000-900000', 'Colombo dining group for cocktail weddings and after-parties.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Barefoot Garden Cafe Events', 'Colombo', 'Colombo', '50000-700000', 'Garden cafe setting and catering for intimate Colombo celebrations.', null, null, 'barefootceylon.com', 'Galle Road, Colombo 04', 4.6, 0, [loc('Colombo 04', 'Colombo 04', 'Colombo')]],
  ['Palmyrah Catering', 'Jaffna', 'Jaffna', '40000-800000', 'Northern Sri Lankan cuisine for Hindu and Christian Jaffna weddings; can travel south on request.', null, null, null, 'Jaffna', 4.6, 0, [loc('Jaffna', 'Jaffna', 'Jaffna')]],
];

const CAKES = [
  ['The Cake Factory', 'Colombo', 'Colombo', '15000-200000', 'Colombo cake studio for wedding tiers, cupcakes and structures.', null, null, null, 'Colombo', 4.6, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Sugar Boutique', 'Colombo', 'Colombo', '20000-250000', 'Designer wedding cakes and dessert tables.', null, null, null, 'Colombo', 4.6, 1, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Butter Boutique', 'Colombo', 'Colombo', '15000-180000', 'Boutique bakery for buttercream wedding cakes and tasting boxes.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['The Cake Affair', 'Colombo', 'Colombo', '18000-220000', 'Custom wedding cakes, jar cakes and homecoming sweets.', null, null, null, 'Colombo', 4.5, 0, [loc('Colombo', 'Colombo', 'Colombo')]],
  ['Kandy Cake Studio', 'Kandy', 'Kandy', '12000-150000', 'Hill-country wedding cakes with delivery to Kandy hotels.', null, null, null, 'Kandy', 4.5, 0, [loc('Kandy', 'Kandy', 'Kandy')]],
];

function districtsFrom(district, locations) {
  const set = new Set([district, ...(locations || []).map((l) => l.district)].filter(Boolean));
  return [...set];
}

function pack(id, category, cats, row, extra = {}) {
  const [name, city, district, priceRange, description, phone, email, website, address, rating, spotlight, locations] = row;
  return {
    id,
    name,
    category,
    categories: cats,
    city,
    district,
    districts: districtsFrom(district, extra.locations || locations),
    priceRange,
    description,
    rating,
    spotlight: Boolean(spotlight),
    phone: phone || null,
    email: email || null,
    website: website || null,
    address: address || city,
    year: '2026',
    sourceFiles: [],
    source: extra.source || 'public-web',
    wiki: extra.wiki || null,
    photoUrl: extra.photoUrl || null,
    quotations: extra.quotations || [
      { id: `${id}-pkg`, title: 'Wedding package', price: String(priceRange).split('-')[0], details: 'Confirm current rates with the vendor. Details compiled from public websites and directories.' },
    ],
    locations: extra.locations || locations || [loc(address || city, city, district)],
  };
}

function buildListings() {
  const listings = [];
  let n = 66;

  VENUES.forEach((row) => {
    const [name, city, district, priceRange, description, email, website, address, wiki, rating, spotlight, locations] = row;
    listings.push(pack(`vw-${String(n).padStart(2, '0')}`, 'Venue & Res. Halls', ['Venue & Res. Halls', 'Caters'],
      [name, city, district, priceRange, description, null, email, website, address, rating, spotlight, locations],
      { wiki, source: 'hotel-website+wikipedia' }));
    n += 1;
  });

  PHOTOGRAPHERS.forEach((row) => {
    const [name, city, district, minUsd, maxUsd, description, phone, email, website, address, photoUrl, rating, spotlight] = row;
    listings.push(pack(`vw-${String(n).padStart(2, '0')}`, 'Photography & Videography', ['Photography & Videography'],
      [name, city, district, `${usdLkr(minUsd)}-${usdLkr(maxUsd)}`, description, phone, email, website, address, rating, spotlight, [loc(city, city, district)]],
      { photoUrl, quotations: photoQuotes(minUsd, maxUsd), source: 'mywed+official-sites' }));
    n += 1;
  });

  JEWELLERY.forEach((row) => {
    listings.push(pack(`vw-${String(n).padStart(2, '0')}`, 'Jewellary', ['Jewellary'], row, { source: 'official-sites' }));
    n += 1;
  });
  BRIDAL.forEach((row) => {
    listings.push(pack(`vw-${String(n).padStart(2, '0')}`, 'Bridal Service', ['Bridal Service'], row, { source: 'public-web' }));
    n += 1;
  });
  GROOM.forEach((row) => {
    listings.push(pack(`vw-${String(n).padStart(2, '0')}`, 'Groom service', ['Groom service'], row, { source: 'public-web' }));
    n += 1;
  });
  FLORAL.forEach((row) => {
    listings.push(pack(`vw-${String(n).padStart(2, '0')}`, 'Floral & Deco', ['Floral & Deco'], row, { source: 'public-web' }));
    n += 1;
  });
  CATERERS.forEach((row) => {
    listings.push(pack(`vw-${String(n).padStart(2, '0')}`, 'Caters', ['Caters'], row, { source: 'public-web' }));
    n += 1;
  });
  CAKES.forEach((row) => {
    listings.push(pack(`vw-${String(n).padStart(2, '0')}`, 'Cakes', ['Cakes'], row, { source: 'public-web' }));
    n += 1;
  });

  return listings;
}

const listings = buildListings();

module.exports = {
  listings,
  count: listings.length,
  firstId: listings[0] && listings[0].id,
  lastId: listings[listings.length - 1] && listings[listings.length - 1].id,
};
