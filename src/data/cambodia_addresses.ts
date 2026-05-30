// Static Address Data for Cambodia (Provinces, Districts, Communes, Villages)
// Used when DB tables do not exist or in Demo Mode to provide seamless cascading dropdown selects.

export interface StaticDistrict {
  id: string;
  province_id: string;
  name_km: string;
  name_en: string;
}

export interface StaticCommune {
  id: string;
  district_id: string;
  name_km: string;
  name_en: string;
}

export interface StaticVillage {
  id: string;
  commune_id: string;
  name_km: string;
  name_en: string;
}

export const STATIC_DISTRICTS: StaticDistrict[] = [
  // 12 - Phnom Penh Capital
  { id: '1201', province_id: '12', name_km: 'ខណ្ឌចម្ការមន', name_en: 'Chamkar Mon' },
  { id: '1202', province_id: '12', name_km: 'ខណ្ឌដូនពេញ', name_en: 'Daun Penh' },
  { id: '1203', province_id: '12', name_km: 'ខណ្ឌ៧មករា', name_en: 'Prampir Meakkara' },
  { id: '1204', province_id: '12', name_km: 'ខណ្ឌទួលគោក', name_en: 'Tuol Kork' },
  { id: '1205', province_id: '12', name_km: 'ខណ្ឌដង្កោ', name_en: 'Dangkor' },
  { id: '1206', province_id: '12', name_km: 'ខណ្ឌមានជ័យ', name_en: 'Meanchey' },
  { id: '1207', province_id: '12', name_km: 'ខណ្ឌឫស្សីកែវ', name_en: 'Russey Keo' },
  { id: '1208', province_id: '12', name_km: 'ខណ្ឌសែនសុខ', name_en: 'Sen Sok' },
  { id: '1209', province_id: '12', name_km: 'ខណ្ឌពោធិ៍សែនជ័យ', name_en: 'Por Senchey' },
  { id: '1210', province_id: '12', name_km: 'ខណ្ឌជ្រោយចង្វារ', name_en: 'Chroy Changvar' },
  { id: '1211', province_id: '12', name_km: 'ខណ្ឌព្រែកព្នៅ', name_en: 'Prek Pnov' },
  { id: '1212', province_id: '12', name_km: 'ខណ្ឌច្បារអំពៅ', name_en: 'Chbar Ampov' },
  { id: '1213', province_id: '12', name_km: 'ខណ្ឌបឹងកេងកង', name_en: 'Boeng Keng Kang' },
  { id: '1214', province_id: '12', name_km: 'ខណ្ឌកំបូល', name_en: 'Kamboul' },

  // 17 - Siemreap
  { id: '1701', province_id: '17', name_km: 'ក្រុងសៀមរាប', name_en: 'Siem Reap Municipality' },
  { id: '1710', province_id: '17', name_km: 'ស្រុកប្រាសាទបាគង', name_en: 'Prasat Bakong' },
  { id: '1703', province_id: '17', name_km: 'ស្រុកបន្ទាយស្រី', name_en: 'Banteay Srei' },
  { id: '1711', province_id: '17', name_km: 'ស្រុកសូទ្រនិគម', name_en: 'Soutr Nikom' },
  { id: '1704', province_id: '17', name_km: 'ស្រុកជីក្រែង', name_en: 'Chi Kreng' },
  { id: '1702', province_id: '17', name_km: 'ស្រុកអង្គរជុំ', name_en: 'Angkor Chum' },
  { id: '1709', province_id: '17', name_km: 'ស្រុកពួក', name_en: 'Puok' },
  { id: '1712', province_id: '17', name_km: 'ស្រុកវ៉ារិន', name_en: 'Varin' },

  // 18 - Preah Sihanouk
  { id: '1801', province_id: '18', name_km: 'ក្រុងព្រះសីហនុ', name_en: 'Sihanoukville Municipality' },
  { id: '1802', province_id: '18', name_km: 'ស្រុកព្រៃនប់', name_en: 'Prey Nob' },
  { id: '1803', province_id: '18', name_km: 'ស្រុកស្ទឹងហាវ', name_en: 'Stueng Hav' },
  { id: '1804', province_id: '18', name_km: 'ស្រុកកំពង់សីលា', name_en: 'Kampong Seila' },
  { id: '1805', province_id: '18', name_km: 'ក្រុងកោះរ៉ុង', name_en: 'Koh Rong Municipality' },

  // 02 - Battambang
  { id: '0203', province_id: '02', name_km: 'ក្រុងបាត់ដំបង', name_en: 'Battambang Municipality' },
  { id: '0208', province_id: '02', name_km: 'ស្រុកសង្កែ', name_en: 'Sangkae' },
  { id: '0201', province_id: '02', name_km: 'ស្រុកបាណន់', name_en: 'Banan' },
  { id: '0206', province_id: '02', name_km: 'ស្រុកមោងឫស្សី', name_en: 'Moung Ruessei' },
  { id: '0209', province_id: '02', name_km: 'ស្រុកថ្មគោល', name_en: 'Thma Koul' },
  { id: '0202', province_id: '02', name_km: 'ស្រុកបវេល', name_en: 'Bavel' },
  { id: '0204', province_id: '02', name_km: 'ស្រុកឯកភ្នំ', name_en: 'Ek Phnom' },

  // 03 - Kampong Cham
  { id: '0303', province_id: '03', name_km: 'ក្រុងកំពង់ចាម', name_en: 'Kampong Cham Municipality' },
  { id: '0304', province_id: '03', name_km: 'ស្រុកកំពង់សៀម', name_en: 'Kampong Siem' },
  { id: '0307', province_id: '03', name_km: 'ស្រុកកងមាស', name_en: 'Kang Meas' },
  { id: '0301', province_id: '03', name_km: 'ស្រុកបាធាយ', name_en: 'Batheay' },
  { id: '0305', province_id: '03', name_km: 'ស្រុកជើងព្រៃ', name_en: 'Cheung Prey' },
  { id: '0302', province_id: '03', name_km: 'ស្រុកចម្ការលើ', name_en: 'Chamkar Leu' },

  // 05 - Kampong Speu
  { id: '0503', province_id: '05', name_km: 'ក្រុងច្បារមន', name_en: 'Chbar Mon Municipality' },
  { id: '0508', province_id: '05', name_km: 'ស្រុកសំរោងទង', name_en: 'Samraong Tong' },
  { id: '0504', province_id: '05', name_km: 'ស្រុកគងពិសី', name_en: 'Kong Pisei' },
  { id: '0507', province_id: '05', name_km: 'ស្រុកឧដុង្គ', name_en: 'Odongk' },
  { id: '0501', province_id: '05', name_km: 'ស្រុកបសេដ្ឋ', name_en: 'Baset' },

  // 08 - Kandal
  { id: '0811', province_id: '08', name_km: 'ក្រុងតាខ្មៅ', name_en: 'Ta Khmau Municipality' },
  { id: '0801', province_id: '08', name_km: 'ស្រុកកណ្ដាលស្ទឹង', name_en: 'Kandal Stueng' },
  { id: '0802', province_id: '08', name_km: 'ស្រុកគៀនស្វាយ', name_en: 'Kien Svay' },
  { id: '0808', province_id: '08', name_km: 'ស្រុកស្អាង', name_en: 'S\'ang' },
  { id: '0804', province_id: '08', name_km: 'ស្រុកកោះធំ', name_en: 'Koh Thom' },
  { id: '0807', province_id: '08', name_km: 'ស្រុកមុខកំពូល', name_en: 'Mukh Kampoul' },

  // 07 - Kampot
  { id: '0708', province_id: '07', name_km: 'ក្រុងកំពត', name_en: 'Kampot Municipality' },
  { id: '0703', province_id: '07', name_km: 'ស្រុកទឹកឈូ', name_en: 'Tuek Chhou' },
  { id: '0701', province_id: '07', name_km: 'ស្រុកអង្គរជ័យ', name_en: 'Angkor Chey' },
  { id: '0702', province_id: '07', name_km: 'ស្រុកបន្ទាយមាស', name_en: 'Banteay Meas' },
  { id: '0704', province_id: '07', name_km: 'ស្រុកកំពង់ត្រាច', name_en: 'Kampong Trach' },

  // 21 - Takeo
  { id: '2108', province_id: '21', name_km: 'ក្រុងដូនកែវ', name_en: 'Doun Kaev Municipality' },
  { id: '2103', province_id: '21', name_km: 'ស្រុកព្រៃកប្បាស', name_en: 'Prey Kabbas' },
  { id: '2101', province_id: '21', name_km: 'ស្រុកអង្គរបុរី', name_en: 'Angkor Borei' },
  { id: '2102', province_id: '21', name_km: 'ស្រុកបាទី', name_en: 'Bati' },
  { id: '2104', province_id: '21', name_km: 'ស្រុកសំរោង', name_en: 'Samraong' },
  { id: '2105', province_id: '21', name_km: 'ស្រុកត្រាំកក់', name_en: 'Tram Kak' },

  // 20 - Svay Rieng
  { id: '2006', province_id: '20', name_km: 'ក្រុងស្វាយរៀង', name_en: 'Svay Rieng Municipality' },
  { id: '2001', province_id: '20', name_km: 'ក្រុងបាវិត', name_en: 'Bavet Municipality' },
  { id: '2005', province_id: '20', name_km: 'ស្រុកស្វាយទាប', name_en: 'Svay Teab' },
  { id: '2002', province_id: '20', name_km: 'ស្រុកចន្ទ្រា', name_en: 'Chantrea' },
  { id: '2003', province_id: '20', name_km: 'ស្រុកកំពង់រោទិ៍', name_en: 'Kampong Rou' },

  // 14 - Prey Veng
  { id: '1412', province_id: '14', name_km: 'ក្រុងព្រៃវែង', name_en: 'Prey Veng Municipality' },
  { id: '1411', province_id: '14', name_km: 'ស្រុកពាមរក៍', name_en: 'Peam Ro' },
  { id: '1410', province_id: '14', name_km: 'ស្រុកពាមជរ', name_en: 'Peam Chor' },
  { id: '1401', province_id: '14', name_km: 'ស្រុកបាភ្នំ', name_en: 'Ba Phnum' },
  { id: '1405', province_id: '14', name_km: 'ស្រុកកំចាយមារ', name_en: 'Kamchay Mear' },
  { id: '1408', province_id: '14', name_km: 'ស្រុកពោធិ៍រៀង', name_en: 'Peas Reang' },

  // 01 - Banteay Meanchey
  { id: '0106', province_id: '01', name_km: 'ក្រុងសិរីសោភ័ណ', name_en: 'Serei Saophoan' },
  { id: '0105', province_id: '01', name_km: 'ក្រុងប៉ោយប៉ែត', name_en: 'Poipet' },
  { id: '0102', province_id: '01', name_km: 'ស្រុកមង្គលបុរី', name_en: 'Mongkol Borei' },
  { id: '0103', province_id: '01', name_km: 'ស្រុកភ្នំស្រុក', name_en: 'Phnum Srok' },
  { id: '0104', province_id: '01', name_km: 'ស្រុកព្រះនេត្រព្រះ', name_en: 'Preah Netr Preah' },

  // 04 - Kampong Chhnang
  { id: '0403', province_id: '04', name_km: 'ក្រុងកំពង់ឆ្នាំង', name_en: 'Kampong Chhnang Municipality' },
  { id: '0405', province_id: '04', name_km: 'ស្រុក រលាប្អៀរ', name_en: 'Rolea B\'ier' },
  { id: '0401', province_id: '04', name_km: 'ស្រុកបរិបូណ៌', name_en: 'Baribour' },
  { id: '0404', province_id: '04', name_km: 'ស្រុកកំពង់ត្រឡាច', name_en: 'Kampong Tralach' },

  // 06 - Kampong Thom
  { id: '0603', province_id: '06', name_km: 'ក្រុងស្ទឹងសែន', name_en: 'Stueng Saen Municipality' },
  { id: '0601', province_id: '06', name_km: 'ស្រុកបារាយណ៍', name_en: 'Baray' },
  { id: '0602', province_id: '06', name_km: 'ស្រុកកំពង់ស្វាយ', name_en: 'Kampong Svay' },
  { id: '0605', province_id: '06', name_km: 'ស្រុកប្រាសាទសំបូរ', name_en: 'Prasat Sambour' },
  { id: '0608', province_id: '06', name_km: 'ស្រុកស្ទោង', name_en: 'Stoung' },

  // 09 - Koh Kong
  { id: '0901', province_id: '09', name_km: 'ក្រុងខេមរភូមិន្ទ', name_en: 'Khemarak Phoumin Municipality' },
  { id: '0903', province_id: '09', name_km: 'ស្រុកស្រែអំបិល', name_en: 'Srae Ambel' },
  { id: '0902', province_id: '09', name_km: 'ស្រុកមណ្ឌលសីមា', name_en: 'Mondol Seima' },
  { id: '0904', province_id: '09', name_km: 'ស្រុកបុទុមសាគរ', name_en: 'Botum Sakor' },

  // 10 - Kratie
  { id: '1001', province_id: '10', name_km: 'ក្រុងក្រចេះ', name_en: 'Kratie Municipality' },
  { id: '1003', province_id: '10', name_km: 'ស្រុកឆ្លូង', name_en: 'Chhloung' },
  { id: '1002', province_id: '10', name_km: 'ស្រុកព្រែកប្រសប់', name_en: 'Prek Prasob' },
  { id: '1004', province_id: '10', name_km: 'ស្រុកសំបូរ', name_en: 'Sambour' },

  // 11 - Mondul Kiri
  { id: '1101', province_id: '11', name_km: 'ក្រុងសែនមនោរម្យ', name_en: 'Sen Monorom Municipality' },
  { id: '1102', province_id: '11', name_km: 'ស្រុកកែវសីមា', name_en: 'Keo Seima' },
  { id: '1103', province_id: '11', name_km: 'ស្រុកកោះញែក', name_en: 'Koh Nhek' },

  // 13 - Preah Vihear
  { id: '1301', province_id: '13', name_km: 'ក្រុងព្រះវិហារ', name_en: 'Preah Vihear Municipality' },
  { id: '1302', province_id: '13', name_km: 'ស្រុកគូលែន', name_en: 'Kulen' },
  { id: '1303', province_id: '13', name_km: 'ស្រុករវៀង', name_en: 'Rovieng' },

  // 15 - Pursat
  { id: '1501', province_id: '15', name_km: 'ក្រុងពោធិ៍សាត់', name_en: 'Pursat Municipality' },
  { id: '1502', province_id: '15', name_km: 'ស្រុកកណ្តៀង', name_en: 'Kandieng' },
  { id: '1503', province_id: '15', name_km: 'ស្រុកបាកាន', name_en: 'Bakan' },
  { id: '1505', province_id: '15', name_km: 'ស្រុកភ្នំក្រវាញ', name_en: 'Phnum Kravanh' },

  // 16 - Ratanak Kiri
  { id: '1601', province_id: '16', name_km: 'ក្រុងបានលុង', name_en: 'Ban Lung Municipality' },
  { id: '1603', province_id: '16', name_km: 'ស្រុកលំផាត់', name_en: 'Lumphat' },
  { id: '1602', province_id: '16', name_km: 'ស្រុកកូនមុំ', name_en: 'Koun Mom' },

  // 19 - Stung Treng
  { id: '1901', province_id: '19', name_km: 'ក្រុងស្ទឹងត្រែង', name_en: 'Stung Treng Municipality' },
  { id: '1903', province_id: '19', name_km: 'ស្រុកសេសាន', name_en: 'Sesan' },
  { id: '1902', province_id: '19', name_km: 'ស្រុកបុរីអូរស្វាយសែនជ័យ', name_en: 'Borei O\'Svay Sen Chey' },

  // 22 - Oddar Meanchey
  { id: '2201', province_id: '22', name_km: 'ក្រុងសំរោង', name_en: 'Samraong Municipality' },
  { id: '2202', province_id: '22', name_km: 'ស្រុកអន្លង់វែង', name_en: 'Anlong Veng' },
  { id: '2203', province_id: '22', name_km: 'ស្រុកបន្ទាយអំពិល', name_en: 'Banteay Ampil' },

  // 23 - Kep
  { id: '2301', province_id: '23', name_km: 'ក្រុងកែប', name_en: 'Kep Municipality' },
  { id: '2302', province_id: '23', name_km: 'ស្រុកដំណាក់ចង្អើរ', name_en: 'Damnak Chang\'aeur' },

  // 24 - Pailin
  { id: '2401', province_id: '24', name_km: 'ក្រុងប៉ៃលិន', name_en: 'Pailin Municipality' },
  { id: '2402', province_id: '24', name_km: 'ស្រុកសាលាក្រៅ', name_en: 'Sala Krau' },

  // 25 - Tboung Khmum
  { id: '2501', province_id: '25', name_km: 'ក្រុងសួង', name_en: 'Suong Municipality' },
  { id: '2502', province_id: '25', name_km: 'ស្រុកត្បូងឃ្មុំ', name_en: 'Tboung Khmum' },
  { id: '2503', province_id: '25', name_km: 'ស្រុកអូររាំងឪ', name_en: 'Ou Reang Ov' },
  { id: '2504', province_id: '25', name_km: 'ស្រុកក្រូចឆ្មារ', name_en: 'Krouch Chhmar' }
];

export const STATIC_COMMUNES: StaticCommune[] = [
  // 1201 - Chamkar Mon
  { id: '120101', district_id: '1201', name_km: 'សង្កាត់ទន្លេបាសាក់', name_en: 'Tonle Basak' },
  { id: '120102', district_id: '1201', name_km: 'សង្កាត់បឹងត្របែក', name_en: 'Boeng Trabaek' },
  { id: '120103', district_id: '1201', name_km: 'សង្កាត់ផ្សារដើមថ្កូវ', name_en: 'Phsar Daeum Thkov' },

  // 1202 - Daun Penh
  { id: '120201', district_id: '1202', name_km: 'សង្កាត់ចតុមុខ', name_en: 'Chaktomukh' },
  { id: '120202', district_id: '1202', name_km: 'សង្កាត់វត្តភ្នំ', name_en: 'Wat Phnum' },
  { id: '120203', district_id: '1202', name_km: 'សង្កាត់ផ្សារថ្មីទី១', name_en: 'Phsar Thmey Muoy' },
  { id: '120204', district_id: '1202', name_km: 'សង្កាត់ផ្សារចាស់', name_en: 'Phsar Chas' },

  // 1203 - Prampir Meakkara
  { id: '120301', district_id: '1203', name_km: 'សង្កាត់អូរឫស្សីទី១', name_en: 'Ou Ruessei Muoy' },
  { id: '120302', district_id: '1203', name_km: 'សង្កាត់វាលវង់', name_en: 'Veal Vong' },

  // 1204 - Tuol Kork
  { id: '120401', district_id: '1204', name_km: 'សង្កាត់ទឹកល្អក់ទី១', name_en: 'Tuek L\'ak Muoy' },
  { id: '120402', district_id: '1204', name_km: 'សង្កាត់បឹងកក់ទី២', name_en: 'Boeng Kak Pi' },
  { id: '120403', district_id: '1204', name_km: 'សង្កាត់ផ្សារដេប៉ូទី២', name_en: 'Phsar Depo Pi' },

  // 1205 - Dangkor
  { id: '120501', district_id: '1205', name_km: 'សង្កាត់ដង្កោ', name_en: 'Dangkor' },
  { id: '120502', district_id: '1205', name_km: 'សង្កាត់ព្រៃស', name_en: 'Prey Sa' },

  // 1206 - Meanchey
  { id: '120601', district_id: '1206', name_km: 'សង្កាត់ស្ទឹងមានជ័យទី៣', name_en: 'Stueng Meanchey Bei' },
  { id: '120602', district_id: '1206', name_km: 'សង្កាត់បឹងទំពុនទី១', name_en: 'Boeng Tumpun Muoy' },

  // 1207 - Russey Keo
  { id: '120701', district_id: '1207', name_km: 'សង្កាត់ទួលសង្កែទី១', name_en: 'Tuol Sangkae Muoy' },
  { id: '120702', district_id: '1207', name_km: 'សង្កាត់គីឡូម៉ែត្រលេខ៦', name_en: 'Kilometr Prambei' },

  // 1208 - Sen Sok
  { id: '120801', district_id: '1208', name_km: 'សង្កាត់ភ្នំពេញថ្មី', name_en: 'Phnom Penh Thmey' },
  { id: '120802', district_id: '1208', name_km: 'សង្កាត់ទឹកថ្លា', name_en: 'Tuek Thla' },
  { id: '120803', district_id: '1208', name_km: 'សង្កាត់អូរបែកក្អម', name_en: 'Ou Baek K\'am' },

  // 1209 - Por Senchey
  { id: '120901', district_id: '1209', name_km: 'សង្កាត់ចោមចៅទី៣', name_en: 'Chaom Chau Bei' },
  { id: '120902', district_id: '1209', name_km: 'សង្កាត់កាកាបទី១', name_en: 'Kakab Muoy' },

  // 1210 - Chroy Changvar
  { id: '121001', district_id: '1210', name_km: 'សង្កាត់ជ្រោយចង្វារ', name_en: 'Chroy Changvar' },
  { id: '121002', district_id: '1210', name_km: 'សង្កាត់ព្រែកលៀប', name_en: 'Prek Lieb' },

  // 1211 - Prek Pnov
  { id: '121101', district_id: '1211', name_km: 'សង្កាត់ព្រែកព្នៅ', name_en: 'Prek Pnov' },

  // 1212 - Chbar Ampov
  { id: '121201', district_id: '1212', name_km: 'សង្កាត់ច្បារអំពៅទី១', name_en: 'Chbar Ampov Muoy' },
  { id: '121202', district_id: '1212', name_km: 'សង្កាត់ព្រែកប្រា', name_en: 'Prek Pra' },

  // 1213 - Boeng Keng Kang
  { id: '121301', district_id: '1213', name_km: 'សង្កាត់បឹងកេងកងទី១', name_en: 'Boeng Keng Kang Muoy' },
  { id: '121302', district_id: '1213', name_km: 'សង្កាត់អូឡាំពិក', name_en: 'Olympic' },

  // 1214 - Kamboul
  { id: '121401', district_id: '1214', name_km: 'សង្កាត់កំបូល', name_en: 'Kamboul' },

  // Siem Reap
  { id: '170101', district_id: '1701', name_km: 'សង្កាត់ទឹករួច', name_en: 'Tuek Ruoch' },
  { id: '170102', district_id: '1701', name_km: 'សង្កាត់ស្វាយដង្គំ', name_en: 'Svay Dangkum' },
  { id: '170103', district_id: '1701', name_km: 'សង្កាត់ស្លក្រាម', name_en: 'Sla Kram' },
  { id: '170104', district_id: '1701', name_km: 'សង្កាត់គោកចក', name_en: 'Kouk Chak' },
  { id: '171001', district_id: '1710', name_km: 'ឃុំបាគង', name_en: 'Bakong' },
  { id: '171002', district_id: '1710', name_km: 'ឃុំរលួស', name_en: 'Roluos' },
  { id: '170301', district_id: '1703', name_km: 'ឃុំព្រះដាក់', name_en: 'Preah Dak' },
  { id: '170302', district_id: '1703', name_km: 'ឃុំខ្នារសណ្តាយ', name_en: 'Khnar Sanday' },

  // Preah Sihanouk
  { id: '180101', district_id: '1801', name_km: 'សង្កាត់លេខ១', name_en: 'Sangkat 1' },
  { id: '180102', district_id: '1801', name_km: 'សង្កាត់លេខ២', name_en: 'Sangkat 2' },
  { id: '180103', district_id: '1801', name_km: 'សង្កាត់លេខ៣', name_en: 'Sangkat 3' },
  { id: '180104', district_id: '1801', name_km: 'សង្កាត់លេខ៤', name_en: 'Sangkat 4' },
  { id: '180201', district_id: '1802', name_km: 'ឃុំវាលរេញ', name_en: 'Veal Renh' },
  { id: '180202', district_id: '1802', name_km: 'ឃុំទឹកល្អក់', name_en: 'Tuek L\'ak' },

  // Battambang
  { id: '020301', district_id: '0203', name_km: 'សង្កាត់ស្វាយប៉ោ', name_en: 'Svay Pao' },
  { id: '020302', district_id: '0203', name_km: 'សង្កាត់ព្រែកព្រះស្តេច', name_en: 'Prek Preah Sdech' },
  { id: '020303', district_id: '0203', name_km: 'សង្កាត់ចំការសំរោង', name_en: 'Chamkar Samraong' },
  { id: '020801', district_id: '0208', name_km: 'ឃុំអន្លង់វិល', name_en: 'Anlong Vil' },
  { id: '020802', district_id: '0208', name_km: 'ឃុំនរា', name_en: 'Norea' },

  // Fallback catch-all for other districts to prevent empty results
  { id: 'full-static-comm-all', district_id: 'all', name_km: 'ឃុំកណ្តាល', name_en: 'Kandal Commune' }
];

export const STATIC_VILLAGES: StaticVillage[] = [
  // Tonle Basak
  { id: '12010101', commune_id: '120101', name_km: 'ភូមិ១', name_en: 'Phum 1' },
  { id: '12010102', commune_id: '120101', name_km: 'ភូមិ២', name_en: 'Phum 2' },
  { id: '12010103', commune_id: '120101', name_km: 'ភូមិ៣', name_en: 'Phum 3' },

  // Boeng Trabaek
  { id: '12010201', commune_id: '120102', name_km: 'ភូមិ៤', name_en: 'Phum 4' },
  { id: '12010202', commune_id: '120102', name_km: 'ភូមិ៥', name_en: 'Phum 5' },

  // Chaktomukh
  { id: '12020101', commune_id: '120201', name_km: 'ភូមិ១', name_en: 'Phum 1' },
  { id: '12020102', commune_id: '120201', name_km: 'ភូមិ២', name_en: 'Phum 2' },
  { id: '12020103', commune_id: '120201', name_km: 'ភូមិ៣', name_en: 'Phum 3' },

  // Wat Phnum
  { id: '12020201', commune_id: '120202', name_km: 'ភូមិ១', name_en: 'Phum 1' },
  { id: '12020202', commune_id: '120202', name_km: 'ភូមិ២', name_en: 'Phum 2' },

  // Tuol Sangkae 1
  { id: '12070101', commune_id: '120701', name_km: 'ភូមិទួលគោក', name_en: 'Tuol Kouk' },
  { id: '12070102', commune_id: '120701', name_km: 'ភូមិទួលសង្កែ', name_en: 'Tuol Sangkae' },

  // Phnom Penh Thmey
  { id: '12080101', commune_id: '120801', name_km: 'ភូមិចុងថ្នល់', name_en: 'Chong Thnal' },
  { id: '12080102', commune_id: '120801', name_km: 'ភូមិភ្នំពេញថ្មី', name_en: 'Phnom Penh Thmey' },

  // Svay Dangkum
  { id: '17010201', commune_id: '170102', name_km: 'ភូមិសាលាកន្សែង', name_en: 'Sala Kansaeng' },
  { id: '17010202', commune_id: '170102', name_km: 'ភូមិស្វាយដង្គំ', name_en: 'Svay Dangkum' },
  { id: '17010203', commune_id: '170102', name_km: 'ភូមិវិហារចិន', name_en: 'Vihear Chen' },

  // Sla Kram
  { id: '17010301', commune_id: '170103', name_km: 'ភូមិស្លក្រាម', name_en: 'Sla Kram' },
  { id: '17010302', commune_id: '170103', name_km: 'ភូមិមណ្ឌល១', name_en: 'Mondul 1' },

  // Sangkat 1
  { id: '18010101', commune_id: '180101', name_km: 'ភូមិ១', name_en: 'Phum 1' },
  { id: '18010102', commune_id: '180101', name_km: 'ភូមិ២', name_en: 'Phum 2' },

  // Svay Pao
  { id: '02030101', commune_id: '020301', name_km: 'ភូមិព្រែកមហាទេព', name_en: 'Prek Moha Tep' },
  { id: '02030102', commune_id: '020301', name_km: 'ភូមិស្វាយប៉ោ', name_en: 'Svay Pao' }
];

// Helper functions to get static values
export function getStaticDistricts(provinceId: string): StaticDistrict[] {
  // If we don't have matching static districts, let's auto-generate a few generic ones based on the province code
  const exact = STATIC_DISTRICTS.filter(d => d.province_id === provinceId);
  if (exact.length > 0) return exact;

  // Otherwise, create a few generic districts for this province
  return [
    { id: `${provinceId}01`, province_id: provinceId, name_km: 'ក្រុង/ស្រុកទី១ (District 1)', name_en: 'District 1' },
    { id: `${provinceId}02`, province_id: provinceId, name_km: 'ស្រុកទី២ (District 2)', name_en: 'District 2' },
    { id: `${provinceId}03`, province_id: provinceId, name_km: 'ស្រុកទី៣ (District 3)', name_en: 'District 3' }
  ];
}

export function getStaticCommunes(districtId: string): StaticCommune[] {
  const exact = STATIC_COMMUNES.filter(c => c.district_id === districtId);
  if (exact.length > 0) return exact;

  // Generic communes
  return [
    { id: `${districtId}01`, district_id: districtId, name_km: 'ឃុំ/សង្កាត់ទី១ (Commune 1)', name_en: 'Commune 1' },
    { id: `${districtId}02`, district_id: districtId, name_km: 'ឃុំ/សង្កាត់ទី២ (Commune 2)', name_en: 'Commune 2' },
    { id: `${districtId}03`, district_id: districtId, name_km: 'ឃុំ/សង្កាត់ទី៣ (Commune 3)', name_en: 'Commune 3' }
  ];
}

export function getStaticVillages(communeId: string): StaticVillage[] {
  const exact = STATIC_VILLAGES.filter(v => v.commune_id === communeId);
  if (exact.length > 0) return exact;

  // Generic villages
  return [
    { id: `${communeId}01`, commune_id: communeId, name_km: 'ភូមិទី១ (Village 1)', name_en: 'Village 1' },
    { id: `${communeId}02`, commune_id: communeId, name_km: 'ភូមិទី២ (Village 2)', name_en: 'Village 2' },
    { id: `${communeId}03`, commune_id: communeId, name_km: 'ភូមិទី៣ (Village 3)', name_en: 'Village 3' }
  ];
}
