// ============================================================
// DATA: UBIGEO NACIONAL DEL PERÚ (25 REGIONES / DEPARTAMENTOS)
// Estructura jerárquica offline-first para brigadas médicas rurales
// ============================================================

export const UBIGEO_PERU: Record<string, Record<string, string[]>> = {
  Cusco: {
    Urubamba: ['Urubamba', 'Chinchero', 'Huayllabamba', 'Machupicchu', 'Maras', 'Ollantaytambo', 'Yucay'],
    Cusco: ['Cusco', 'Ccorca', 'Poroy', 'San Jerónimo', 'San Sebastián', 'Santiago', 'Saylla', 'Wanchaq'],
    Anta: ['Anta', 'Ancahuasi', 'Cachimayo', 'Chinchaypujio', 'Huarocondo', 'Limatambo', 'Mollepata', 'Pucyura', 'Zurite'],
    Calca: ['Calca', 'Coya', 'Lamay', 'Lares', 'Písac', 'San Salvador', 'Taray', 'Yanatile'],
    Quispicanchi: ['Urcos', 'Andahuaylillas', 'Camanti', 'Ccarhuayo', 'Ccatca', 'Cusipata', 'Huaro', 'Lucre', 'Marcapata', 'Ocongate', 'Oropesa', 'Quiquijana'],
    Paucartambo: ['Paucartambo', 'Caicay', 'Challabamba', 'Colquepata', 'Huancarani', 'Kosñipata'],
    Canchis: ['Sicuani', 'Checacupe', 'Combapata', 'Marangani', 'Pitumarca', 'San Pablo', 'San Pedro', 'Tinta'],
    Canas: ['Yanaoca', 'Checca', 'Kunturkanki', 'Langui', 'Layo', 'Pampamarca', 'Quehue', 'Túpac Amaru'],
    Acomayo: ['Acomayo', 'Acopia', 'Acos', 'Mosoc Llacta', 'Pomacanchi', 'Rondocan', 'Sangarará'],
    Chumbivilcas: ['Santo Tomás', 'Capacmarca', 'Chamaca', 'Colquemarca', 'Livitaca', 'Llusco', 'Quiñota', 'Velille'],
    Espinar: ['Espinar', 'Condoroma', 'Coporaque', 'Ocoruro', 'Pallpata', 'Pichigua', 'Suyckutambo', 'Alto Pichigua'],
    'La Convención': ['Santa Ana (Quillabamba)', 'Echarate', 'Huayopata', 'Maranura', 'Ocobamba', 'Quellouno', 'Kimbiri', 'Santa Teresa', 'Vilcabamba', 'Pichari', 'Inkawasi', 'Villa Virgen', 'Villa Kintiarina', 'Megantoni'],
    Paruro: ['Paruro', 'Accha', 'Ccapi', 'Colcha', 'Huanoquite', 'Omacha', 'Paccaritambo', 'Pillpinto', 'Yaurisque'],
  },
  Lima: {
    Lima: [
      'Cercado de Lima', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas',
      'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho-Chosica',
      'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa',
      'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores',
      'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco',
      'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
    ],
    Barranca: ['Barranca', 'Paramonga', 'Pativilca', 'Supe', 'Supe Puerto'],
    Cañete: ['San Vicente de Cañete', 'Asia', 'Calango', 'Cerro Azul', 'Chilca', 'Coayllo', 'Imperial', 'Lunahuaná', 'Mala', 'Nuevo Imperial', 'Pacarán', 'Quilmaná', 'San Antonio', 'San Luis', 'Santa Cruz de Flores', 'Zúñiga'],
    Huaral: ['Huaral', 'Atavillos Alto', 'Atavillos Bajo', 'Aucallama', 'Chancay', 'Ihuarí', 'Lampián', 'Pacaraos', 'San Miguel de Acos', 'Santa Cruz de Andamarca', 'Sumbilca', 'Veintisiete de Noviembre'],
    Huarochirí: ['Matucana', 'Antioquía', 'Callahuanca', 'Carampoma', 'Chicla', 'Cuenca', 'Huachupampa', 'Huanza', 'Huarochirí', 'Lahuaytambo', 'Langa', 'Laraos', 'Mariatana', 'Ricardo Palma', 'San Andrés de Tupicocha', 'San Antonio', 'San Bartolomé', 'San Damián', 'San Juan de Iris', 'San Juan de Tantaranche', 'San Lorenzo de Quinti', 'San Mateo', 'San Mateo de Otao', 'San Pedro de Casta', 'San Pedro de Huancayre', 'Sangallaya', 'Santa Cruz de Cocachacra', 'Santa Eulalia', 'Santiago de Anchucaya', 'Santiago de Tuna', 'Santo Domingo de los Olleros', 'Surco'],
    Huaura: ['Huacho', 'Ámbar', 'Caleta de Carquín', 'Checras', 'Hualmay', 'Huaura', 'Leoncio Prado', 'Paccho', 'Santa Leonor', 'Santa María', 'Sayán', 'Végueta'],
    Canta: ['Canta', 'Arahuay', 'Huamantanga', 'Huaros', 'Lachaqui', 'San Buenaventura', 'Santa Rosa de Quives'],
    Cajatambo: ['Cajatambo', 'Copa', 'Gorgor', 'Huancapón', 'Manás'],
    Oyón: ['Oyón', 'Andajes', 'Caujul', 'Cochamarca', 'Naván', 'Pachangara'],
    Yauyos: ['Yauyos', 'Alis', 'Ayauca', 'Ayaviri', 'Azángaro', 'Cacra', 'Carania', 'Catahuasi', 'Chocos', 'Cochas', 'Colonia', 'Carania', 'Huancaya', 'Huangáscar', 'Huantán', 'Huañec', 'Laraos', 'Lincha', 'Madean', 'Miraflores', 'Omas', 'Putinza', 'Quinches', 'Quinocay', 'San Joaquín', 'San Pedro de Pilas', 'Tanta', 'Tauripampa', 'Tomas', 'Tupe', 'Viñac', 'Vitis']
  },
  Apurímac: {
    Abancay: ['Abancay', 'Chacoche', 'Circa', 'Curahuasi', 'Huanipaca', 'Lambrama', 'Pichirhua', 'San Pedro de Cachora', 'Tamburco'],
    Andahuaylas: ['Andahuaylas', 'Andarapa', 'Chiara', 'Huancarama', 'Huancaray', 'Huayana', 'Kishuara', 'Pacobamba', 'Pacucha', 'Pampachiri', 'Pomacocha', 'San Antonio de Cachi', 'San Jerónimo', 'San Miguel de Chaccrampa', 'Santa María de Chicmo', 'Talavera', 'Tumay Huaraca', 'Turpo', 'Kaquiabamba', 'José María Arguedas'],
    Antabamba: ['Antabamba', 'El Oro', 'Huaquirca', 'Juan Espinoza Medrano', 'Oropesa', 'Pachaconas', 'Sabaino'],
    Aymaraes: ['Chalhuanca', 'Capaya', 'Caraybamba', 'Chapimarca', 'Colcabamba', 'Cotaruse', 'Ihuayllo', 'Justo Apu Sahuaraura', 'Lucre', 'Pocohuanca', 'San Juan de Chacña', 'Sañayca', 'Soraya', 'Tapairihua', 'Tintay', 'Toraya', 'Yanaca'],
    Cotabambas: ['Tambobamba', 'Cotabambas', 'Coyllurqui', 'Haquira', 'Mara', 'Challhuahuacho'],
    Chincheros: ['Chincheros', 'Anco_Huallo', 'Cocharcas', 'Huaccana', 'Ocobamba', 'Ongoy', 'Uranmarca', 'Ranracancha', 'Rocchacc', 'El Porvenir', 'Los Chankas'],
    Grau: ['Chuquibambilla', 'Curpahuasi', 'Gamarra', 'Huayllati', 'Mamara', 'Mariscal Gamarra', 'Micaela Bastidas', 'Pataypampa', 'Progreso', 'San Antonio', 'Santa Rosa', 'Turpay', 'Vilcabamba', 'Virundo', 'Curasco']
  },
  Arequipa: {
    Arequipa: ['Arequipa', 'Alto Selva Alegre', 'Cayma', 'Cerro Colorado', 'Characato', 'Chiguata', 'Jacobo Hunter', 'La Joya', 'Mariano Melgar', 'Miraflores', 'Mollebaya', 'Paucarpata', 'Pocsi', 'Polobaya', 'Quequeña', 'Sabandía', 'Sachaca', 'San Juan de Siguas', 'San Juan de Tarucani', 'Santa Isabel de Siguas', 'Santa Rita de Siguas', 'Socabaya', 'Tiabaya', 'Uchumayo', 'Vitor', 'Yanahuara', 'Yarabamba', 'Yura', 'José Luis Bustamante y Rivero'],
    Camaná: ['Camaná', 'José María Quimper', 'Mariano Nicolás Valcárcel', 'Mariscal Cáceres', 'Nicolás de Piérola', 'Ocoña', 'Quilca', 'Samuel Pastor'],
    Caravelí: ['Caravelí', 'Acarí', 'Atico', 'Atiquipa', 'Bella Unión', 'Cahuacho', 'Chala', 'Chaparra', 'Huanuhuanu', 'Jaqui', 'Lomas', 'Quicacha', 'Yauca'],
    Castilla: ['Aplao', 'Andagua', 'Ayo', 'Chachas', 'Chilcaymarca', 'Choco', 'Huancarqui', 'Machaguay', 'Orcopampa', 'Pampacolca', 'Tipán', 'Uñón', 'Uraca', 'Viraco'],
    Caylloma: ['Chivay', 'Achoma', 'Cabanaconde', 'Callalli', 'Caylloma', 'Coporaque', 'Huambo', 'Huanca', 'Ichupampa', 'Lari', 'Lluta', 'Maca', 'Madrigal', 'San Antonio de Chuca', 'Sibayo', 'Tapay', 'Tisco', 'Tuti', 'Yanque', 'Majes'],
    Condesuyos: ['Chuquibamba', 'Andaray', 'Cayarani', 'Chichas', 'Iray', 'Río Grande', 'Salamanca', 'Yanaquihua'],
    Islay: ['Mollendo', 'Cocachacra', 'Dean Valdivia', 'Islay', 'Mejía', 'Punta de Bombón'],
    'La Unión': ['Cotahuasi', 'Alca', 'Charcana', 'Huaynacotas', 'Pampamarca', 'Puyca', 'Quechualla', 'Sayla', 'Tauria', 'Tomepampa', 'Toro']
  },
  Ayacucho: {
    Huamanga: ['Ayacucho', 'Acocro', 'Acos Vinchos', 'Carmen Alto', 'Chiara', 'Jesús Nazareno', 'Ocros', 'Pacaycasa', 'Quinua', 'San José de Ticllas', 'San Juan Bautista', 'Santiago de Pischa', 'Socos', 'Tambillo', 'Vinchos', 'Andrés Avelino Cáceres Dorregaray'],
    Cangallo: ['Cangallo', 'Chuschi', 'Los Morochucos', 'María Parado de Bellido', 'Paras', 'Totos'],
    Huanta: ['Huanta', 'Ayahuanco', 'Huamanguilla', 'Iguain', 'Luricocha', 'Santillana', 'Sivia', 'Llochegua', 'Canayre', 'Uchuraccay', 'Pucacolpa', 'Chaca'],
    'La Mar': ['San Miguel', 'Anco', 'Ayna', 'Chilcas', 'Chungui', 'Luis Carranza', 'Santa Rosa', 'Tambo', 'Samugari', 'Anchihuay', 'Oronccoy'],
    Lucanas: ['Puquio', 'Aucara', 'Cabana', 'Carmen Salcedo', 'Chaviña', 'Chipao', 'Huac-Huas', 'Laramate', 'Leoncio Prado', 'Llauta', 'Lucanas', 'Ocaña', 'Otoca', 'Saisa', 'San Cristóbal', 'San Juan', 'San Pedro', 'San Pedro de Palco', 'Sancos', 'Santa Ana de Huaycahuacho', 'Santa Lucía'],
    Parinacochas: ['Coracora', 'Chumpi', 'Coronel Castañeda', 'Pacapausa', 'Pullo', 'Puyusca', 'San Francisco de Ravacayco', 'Upahuacho'],
    Sucre: ['Querobamba', 'Belén', 'Chalcos', 'Chilcayoc', 'Huacaña', 'Morcolla', 'Paico', 'San Pedro de Larcay', 'San Salvador de Quije', 'Santiago de Paucaray', 'Soras'],
    'Víctor Fajardo': ['Huancapi', 'Alcamenca', 'Apongo', 'Asquipata', 'Canaria', 'Cayara', 'Colca', 'Huamanquiquia', 'Huancaraylla', 'Sarhua', 'Vilcanchos'],
    Vilcashuamán: ['Vilcashuamán', 'Accomarca', 'Carhuanca', 'Concepción', 'Huambalpa', 'Independencia', 'Saurama', 'Vischongo'],
    'Huanca Sancos': ['Sancos', 'Carapo', 'Sacsamarca', 'Santiago de Lucanamarca'],
    'Páucar del Sara Sara': ['Pausa', 'Colta', 'Corculla', 'Lampa', 'Marcabamba', 'Oyolo', 'Pararca', 'San Javier de Alpabamba', 'San José de Ushua', 'Sara Sara']
  },
  Puno: {
    Puno: ['Puno', 'Acora', 'Amantaní', 'Atuncolla', 'Capachica', 'Chucuito', 'Coata', 'Huata', 'Mañazo', 'Paucarcolla', 'Pichacani', 'Platería', 'San Antonio', 'Tiquillaca', 'Vilque'],
    'San Román': ['Juliaca', 'Cabana', 'Cabanillas', 'Caracoto', 'San Miguel'],
    Azángaro: ['Azángaro', 'Achaya', 'Arapa', 'Asillo', 'Caminaca', 'Chupa', 'José Domingo Choquehuanca', 'Muñani', 'Potoni', 'Saman', 'San Antón', 'San José', 'San Juan de Salinas', 'Santiago de Pupuja', 'Tirapata'],
    Carabaya: ['Macusani', 'Ajoyani', 'Ayapata', 'Coasa', 'Corani', 'Crucero', 'Ituata', 'Ollachea', 'San Gabán', 'Usicayos'],
    Chucuito: ['Juli', 'Desaguadero', 'Huacullani', 'Kelluyo', 'Pisacoma', 'Pomata', 'Zepita'],
    'El Collao': ['Ilave', 'Capazo', 'Pilcuyo', 'Santa Rosa', 'Conduriri'],
    Huancané: ['Huancané', 'Cojata', 'Huatasani', 'Inchupalla', 'Pusi', 'Rosaspata', 'Taraco', 'Vilque Chico'],
    Lampa: ['Lampa', 'Cabanilla', 'Calapuja', 'Nicasio', 'Ocuviri', 'Palca', 'Paratía', 'Pucará', 'Santa Lucía', 'Vila Vila'],
    Melgar: ['Ayaviri', 'Antauta', 'Cupi', 'Llalli', 'Macari', 'Nuñoa', 'Orurillo', 'Santa Rosa', 'Umachiri'],
    Moho: ['Moho', 'Conima', 'Huayrapata', 'Tilali'],
    'San Antonio de Putina': ['Putina', 'Ananea', 'Pedro Vilca Apaza', 'Quilcapuncu', 'Sina'],
    Sandia: ['Sandia', 'Cuyocuyo', 'Limbani', 'Patambuco', 'Phara', 'Quiaca', 'San Juan del Oro', 'Yanahuaya', 'Alto Inambari', 'San Pedro de Putina Punco'],
    Yunguyo: ['Yunguyo', 'Anapia', 'Copani', 'Cuturapi', 'Ollaraya', 'Tinicachi', 'Unicachi']
  },
  Junín: {
    Huancayo: ['Huancayo', 'Carhuacallanga', 'Chacapampa', 'Chicche', 'Chilca', 'Chongos Alto', 'Chupuro', 'Colca', 'Cullhuas', 'El Tambo', 'Huacrapuquio', 'Hualhuas', 'Huancán', 'Huasicancha', 'Huayucachi', 'Ingenio', 'Pariahuanca', 'Pilcomayo', 'Pucará', 'Quichuay', 'Quilcas', 'San Agustín', 'San Jerónimo de Tunán', 'Saño', 'Sapallanga', 'Sicaya', 'Santo Domingo de Acobamba', 'Viques'],
    Chanchamayo: ['Chanchamayo (La Merced)', 'Perené', 'Pichanaqui', 'San Luis de Shuaro', 'San Ramón', 'Vitoc'],
    Chupaca: ['Chupaca', 'Áhuac', 'Chongos Bajo', 'Huáchac', 'Huamancaca Chico', 'San Juan de Iscos', 'San Juan de Jarpa', 'Tres de Diciembre', 'Yanacancha'],
    Concepción: ['Concepción', 'Aco', 'Andamarca', 'Comas', 'Cochas', 'Chambara', 'Heroínas Toledo', 'Manzanares', 'Mariscal Castilla', 'Matahuasi', 'Mito', 'Nueve de Julio', 'Orcotuna', 'San José de Quero', 'Santa Rosa de Ocopa'],
    Jauja: ['Jauja', 'Acolla', 'Apata', 'Ataura', 'Canchayllo', 'Curicaca', 'El Mantaro', 'Huamalí', 'Huaripampa', 'Huertas', 'Janjaillo', 'Julcán', 'Leonor Ordóñez', 'Llocllapampa', 'Marco', 'Masma', 'Masma Chicche', 'Molinos', 'Monobamba', 'Muqui', 'Muquiyauyo', 'Paca', 'Paccha', 'Pancán', 'Parco', 'Pomacancha', 'Ricrán', 'San Lorenzo', 'San Pedro de Chunán', 'Sausa', 'Sincos', 'Tunan Marca', 'Yauli', 'Yauyos'],
    Junín: ['Junín', 'Carhuamayo', 'Ondores', 'San Pedro de Cajas'],
    Satipo: ['Satipo', 'Coviriali', 'Llaylla', 'Mazamari', 'Pampa Hermosa', 'Pangoa', 'Río Negro', 'Río Tambo', 'Vizcatán del Ene'],
    Tarma: ['Tarma', 'Acobamba', 'Huaricolca', 'Huasahuasi', 'La Unión', 'Palca', 'Palcamayo', 'San Pedro de Cajas', 'Tapo'],
    Yauli: ['La Oroya', 'Chacapalpa', 'Huay-Huay', 'Marcapomacocha', 'Morococha', 'Paccha', 'Santa Bárbara de Carhuacayán', 'Santa Rosa de Sacco', 'Suitucancha', 'Yauli']
  },
  Huancavelica: {
    Huancavelica: ['Huancavelica', 'Acobambilla', 'Acoria', 'Conayca', 'Cuenca', 'Huachocolpa', 'Huayllahuara', 'Izcuchaca', 'Laria', 'Manta', 'Mariscal Cáceres', 'Moya', 'Nuevo Occoro', 'Palca', 'Pilchaca', 'Vilca', 'Yauli', 'Ascensión', 'Huando'],
    Acobamba: ['Acobamba', 'Andabamba', 'Anta', 'Caja', 'Marcas', 'Paucará', 'Pomacocha', 'Rosario'],
    Angaraes: ['Lircay', 'Anchonga', 'Callanmarca', 'Ccochaccasa', 'Chincho', 'Congalla', 'Huanca-Huanca', 'Huayllay Grande', 'Julcamarca', 'San Antonio de Antaparco', 'Santo Tomás de Pata', 'Secclla'],
    Castrovirreyna: ['Castrovirreyna', 'Arma', 'Aurahua', 'Capillas', 'Chupamarca', 'Cocas', 'Huachos', 'Huamatambo', 'Mollepampa', 'San Juan', 'Santa Ana', 'Tantara', 'Ticrapo'],
    Churcampa: ['Churcampa', 'Anco', 'Chinchihuasi', 'El Carmen', 'La Merced', 'Locroja', 'Paucarbamba', 'San Miguel de Mayocc', 'San Pedro de Coris', 'Pachamarca', 'Cosme'],
    Huaytará: ['Huaytará', 'Ayaví', 'Córdova', 'Huayacundo Arma', 'Laramarca', 'Ocoyo', 'Pilpichaca', 'Querco', 'Quito-Arma', 'San Antonio de Cusicancha', 'San Francisco de Sangayaico', 'San Isidro', 'Santiago de Chocorvos', 'Santiago de Quirahuara', 'Santo Domingo de Capillas', 'Tambo'],
    Tayacaja: ['Pampas', 'Acostambo', 'Acraquia', 'Ahuaycha', 'Colcabamba', 'Daniel Hernández', 'Huachocolpa', 'Huaribamba', 'Ñahuimpuquio', 'Pazos', 'Quishuar', 'Salcabamba', 'Salcahuasi', 'San Marcos de Rocchac', 'Surcubamba', 'Tintay Puncu', 'Quichuas', 'Andaymarca', 'Roble', 'Pichos', 'Santiago de Tucuma']
  },
  Áncash: {
    Huaraz: ['Huaraz', 'Cochabamba', 'Colcabamba', 'Huanchay', 'Independencia', 'Jangas', 'La Libertad', 'Olleros', 'Pampas Grande', 'Pariacoto', 'Pira', 'Tarica'],
    Santa: ['Chimbote', 'Cáceres del Perú', 'Coishco', 'Macate', 'Moro', 'Nepeña', 'Samanco', 'Santa', 'Nuevo Chimbote'],
    Carhuaz: ['Carhuaz', 'Acopampa', 'Amashca', 'Anta', 'Ataquero', 'Marcara', 'Pariahuanca', 'San Miguel de Aco', 'Shilla', 'Tinco', 'Yungar'],
    Huari: ['Huari', 'Anra', 'Cajay', 'Chavín de Huántar', 'Huacachi', 'Huacchis', 'Huachis', 'Huantar', 'Masin', 'Paucas', 'Pontó', 'Rahuapampa', 'Rapayan', 'San Marcos', 'San Pedro de Chaná', 'Uco'],
    Huaylas: ['Caraz', 'Huallanca', 'Huata', 'Huaylas', 'Mato', 'Pamparomás', 'Pueblo Libre', 'Santa Cruz', 'Santo Toribio', 'Yuracmarca'],
    Yungay: ['Yungay', 'Cascapara', 'Mancos', 'Matacoto', 'Quillo', 'Ranrahirca', 'Shupluy', 'Yanama'],
    Casma: ['Casma', 'Buena Vista Alta', 'Comandante Noel', 'Yaután'],
    Huarmey: ['Huarmey', 'Cochapeti', 'Culebras', 'Huayan', 'Malvas'],
    Recuay: ['Recuay', 'Catac', 'Cotaparaco', 'Huayllapampa', 'Llacllin', 'Marca', 'Pampas Chico', 'Pararin', 'Tapacocha', 'Ticapampa']
  },
  'La Libertad': {
    Trujillo: ['Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo', 'Moche', 'Poroto', 'Salaverry', 'Simbal', 'Víctor Larco Herrera'],
    Ascope: ['Ascope', 'Chicama', 'Chocope', 'Magdalena de Cao', 'Paiján', 'Rázuri', 'Santiago de Cao', 'Casa Grande'],
    Chepén: ['Chepén', 'Pacanga', 'Pueblo Nuevo'],
    Pacasmayo: ['San Pedro de Lloc', 'Guadalupe', 'Jequetepeque', 'Pacasmayo', 'San José'],
    Otuzco: ['Otuzco', 'Agallpampa', 'Charat', 'Huaranchal', 'La Cuesta', 'Mache', 'Paranday', 'Salpo', 'Sinsicap', 'Usquil'],
    'Sánchez Carrión': ['Huamachuco', 'Chugay', 'Cochorco', 'Curgos', 'Marcabal', 'Sanagorán', 'Sarín', 'Sartimbamba'],
    'Santiago de Chuco': ['Santiago de Chuco', 'Angasmarca', 'Cachicadán', 'Mollebamba', 'Mollepata', 'Quiruvilca', 'Santa Cruz de Chuca', 'Sitabamba'],
    Virú: ['Virú', 'Chao', 'Guadalupito']
  },
  Lambayeque: {
    Chiclayo: ['Chiclayo', 'Chongoyape', 'Eten', 'Eten Puerto', 'José Leonardo Ortiz', 'La Victoria', 'Lagunas', 'Monsefú', 'Nueva Arica', 'Oyotún', 'Picsi', 'Pimentel', 'Reque', 'Santa Rosa', 'Saña', 'Cayaltí', 'Pátapo', 'Pomalca', 'Pucalá', 'Tumán'],
    Ferreñafe: ['Ferreñafe', 'Cañaris', 'Incahuasi', 'Manuel Antonio Mesones Muro', 'Pítipo', 'Pueblo Nuevo'],
    Lambayeque: ['Lambayeque', 'Chochope', 'Illimo', 'Jayanca', 'Mórrope', 'Motupe', 'Olmos', 'Pacora', 'Salas', 'San José', 'Túcume']
  },
  Piura: {
    Piura: ['Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallán', 'La Arena', 'La Unión', 'Las Lomas', 'Tambo Grande', 'Veintiséis de Octubre'],
    Ayabaca: ['Ayabaca', 'Frías', 'Jililí', 'Lagunas', 'Montero', 'Pacaipampa', 'Paimas', 'Sapillica', 'Sicchez', 'Suyo'],
    Huancabamba: ['Huancabamba', 'Canchaque', 'El Carmen de la Frontera', 'Huarmaca', 'Lalaquiz', 'San Miguel de El Faique', 'Sondor', 'Sondorillo'],
    Morropón: ['Chulucanas', 'Buenos Aires', 'Chalaco', 'La Matanza', 'Morropón', 'Salitral', 'San Juan de Bigote', 'Santa Catalina de Mossa', 'Santo Domingo', 'Yamango'],
    Paita: ['Paita', 'Amotape', 'Arenal', 'Colán', 'La Huaca', 'Tamarindo', 'Vichayal'],
    Sullana: ['Sullana', 'Bellavista', 'Ignacio Escudero', 'Lancones', 'Marcavelica', 'Miguel Checa', 'Querecotillo', 'Salitral'],
    Talara: ['Pariñas (Talara)', 'El Alto', 'La Brea', 'Lobitos', 'Los Órganos', 'Máncora'],
    Sechura: ['Sechura', 'Bellavista de la Unión', 'Bernal', 'Cristo Nos Valga', 'Vice', 'Rinconada Llícuar']
  },
  Cajamarca: {
    Cajamarca: ['Cajamarca', 'Asunción', 'Chetilla', 'Cospán', 'Encañada', 'Jesús', 'Llacanora', 'Los Baños del Inca', 'Magdalena', 'Matara', 'Namora', 'San Juan'],
    Chota: ['Chota', 'Anguía', 'Chadin', 'Chiguirip', 'Chimban', 'Choropampa', 'Cochabamba', 'Conchan', 'Huambos', 'Lajas', 'Llama', 'Miracosta', 'Paccha', 'Pion', 'Querocoto', 'San Juan de Licupis', 'Tacabamba', 'Tocmoche', 'Chalamarca'],
    Jaén: ['Jaén', 'Bellavista', 'Chontalí', 'Colasay', 'Huabal', 'Las Pirias', 'Pomahuaca', 'Pucará', 'Sallique', 'San Felipe', 'San José del Alto', 'Santa Rosa'],
    Cutervo: ['Cutervo', 'Callayuc', 'Choros', 'Cujillo', 'La Ramada', 'Pimpingos', 'Querocotillo', 'San Andrés de Cutervo', 'San Juan de Cutervo', 'San Luis de Lucma', 'Santa Cruz', 'Santo Domingo de la Capilla', 'Santo Tomás', 'Socota', 'Toribio Casanova'],
    Celendín: ['Celendín', 'Chumuch', 'Cortegana', 'Huasmin', 'Jorge Chávez', 'José Gálvez', 'Miguel Iglesias', 'Oxamarca', 'Sorochuco', 'Sucre', 'Utco', 'La Libertad de Pallán'],
    Hualgayoc: ['Bambamarca', 'Chugur', 'Hualgayoc']
  },
  Ica: {
    Ica: ['Ica', 'La Tinguiña', 'Los Aquijes', 'Ocucaje', 'Pachacútec', 'Parcona', 'Pueblo Nuevo', 'Salas (Guadalupe)', 'San José de los Molinos', 'San Juan Bautista', 'Santiago', 'Subtanjalla', 'Tate', 'Yauca del Rosario'],
    Chincha: ['Chincha Alta', 'Alto Larán', 'Chavín', 'Chincha Baja', 'El Carmen', 'Grocio Prado', 'Pueblo Nuevo', 'San Juan de Yanac', 'San Pedro de Huacarpana', 'Sunampe', 'Tambo de Mora'],
    Nazca: ['Nazca', 'Changuillo', 'El Ingenio', 'Marcona', 'Vista Alegre'],
    Palpa: ['Palpa', 'Llipata', 'Río Grande', 'Santa Cruz', 'Tibillo'],
    Pisco: ['Pisco', 'Huancano', 'Humay', 'Independencia', 'Paracas', 'San Andrés', 'San Clemente', 'Túpac Amaru Inca']
  },
  Huánuco: {
    Huánuco: ['Huánuco', 'Amarilis', 'Chinchao', 'Churubamba', 'Margos', 'Quisqui', 'San Francisco de Cayrán', 'San Pedro de Chaulán', 'Santa María del Valle', 'Yarumayo', 'Pillco Marca', 'Yacus'],
    'Leoncio Prado': ['Rupa-Rupa (Tingo María)', 'Daniel Alomía Robles', 'Hermilio Valdizán', 'José Crespo y Castillo', 'Luyando', 'Mariano Dámaso Beraún', 'Pucayacu', 'Castillo Grande', 'Pueblo Nuevo', 'Santo Domingo de Anda'],
    Ambo: ['Ambo', 'Cayna', 'Colpas', 'Conchamarca', 'Huácar', 'San Francisco', 'San Rafael', 'Tomay Kichwa'],
    'Dos de Mayo': ['La Unión', 'Chuquis', 'Marías', 'Pachas', 'Quivilla', 'Ripán', 'Shunqui', 'Sillapata', 'Yanas']
  },
  San_Martin: {
    'San Martín': ['Tarapoto', 'Alberto Leveau', 'Cacatachi', 'Chazuta', 'Chipurana', 'El Porvenir', 'Huimbayoc', 'Juan Guerra', 'La Banda de Shilcayo', 'Morales', 'Papaplaya', 'San Antonio', 'Sauce', 'Shapaja'],
    Moyobamba: ['Moyobamba', 'Calzada', 'Habana', 'Jepelacio', 'Soritor', 'Yantaló'],
    Rioja: ['Rioja', 'Awajún', 'Elias Soplin Vargas', 'Nueva Cajamarca', 'Pardo Miguel', 'Posic', 'San Fernando', 'Yorongos'],
    Lamas: ['Lamas', 'Alonso de Alvarado', 'Barranquita', 'Caynarachi', 'Cuñumbuqui', 'Pinto Recodo', 'Rumisapa', 'San Roque de Cumbaza', 'Shanao', 'Tabalosos', 'Zapatero'],
    'Mariscal Cáceres': ['Juanjuí', 'Campanilla', 'Huicungo', 'Pachiza', 'Pajarillo'],
    Tocache: ['Tocache', 'Nuevo Progreso', 'Pólvora', 'Shunte', 'Uchiza', 'Santa Lucía']
  },
  Loreto: {
    Maynas: ['Iquitos', 'Alto Nanay', 'Fernando Lores', 'Indiana', 'Las Amazonas', 'Mazan', 'Napo', 'Punchana', 'Torres Causana', 'Belén', 'San Juan Bautista'],
    'Alto Amazonas': ['Yurimaguas', 'Balsapuerto', 'Jeberos', 'Lagunas', 'Santa Cruz', 'Teniente César López Rojas'],
    Loreto: ['Nauta', 'Parinari', 'Tigre', 'Trompeteros', 'Urarinas'],
    'Mariscal Ramón Castilla': ['Ramón Castilla', 'Pebas', 'Yavari', 'San Pablo'],
    Requena: ['Requena', 'Alto Tapiche', 'Capelo', 'Emilio San Martín', 'Maquía', 'Puinahua', 'Saquena', 'Soplin', 'Tapiche', 'Jenaro Herrera', 'Yaquerana'],
    Ucayali: ['Contamana', 'Inahuaya', 'Padre Márquez', 'Pampa Hermosa', 'Sarayacu', 'Vargas Guerra'],
    'Datem del Marañón': ['Barranca', 'Cahuapanas', 'Manseriche', 'Morona', 'Pastaza', 'Andoas']
  },
  Ucayali: {
    'Coronel Portillo': ['Callería (Pucallpa)', 'Campoverde', 'Iparía', 'Masisea', 'Yarinacocha', 'Nueva Requena', 'Manantay'],
    Atalaya: ['Raymondi (Atalaya)', 'Sepahua', 'Tahuanía', 'Yurúa'],
    'Padre Abad': ['Padre Abad (Aguaytía)', 'Irázola', 'Curimaná', 'Neshuya', 'Alexander Von Humboldt', 'Boquerón', 'Huipoca'],
    Purús: ['Purús (Esperanza)']
  },
  'Madre de Dios': {
    Tambopata: ['Tambopata (Puerto Maldonado)', 'Inambari', 'Las Piedras', 'Laberinto'],
    Manu: ['Manu', 'Fitzcarrald', 'Madre de Dios', 'Huepetuhe'],
    Tahuamanu: ['Iñapari', 'Iberia', 'Tahuamanu']
  },
  Moquegua: {
    'Mariscal Nieto': ['Moquegua', 'Carumas', 'Cuchumbaya', 'Samegua', 'San Cristóbal', 'Torata'],
    'General Sánchez Cerro': ['Omate', 'Chojata', 'Coalaque', 'Ichuña', 'La Capilla', 'Lloque', 'Matalaque', 'Puquina', 'Quinistaquillas', 'Ubinas', 'Yunga'],
    Ilo: ['Ilo', 'El Algarrobal', 'Pacocha']
  },
  Tacna: {
    Tacna: ['Tacna', 'Alto de la Alianza', 'Calana', 'Ciudad Nueva', 'Inclán', 'Pachía', 'Palca', 'Pocollay', 'Sama', 'Coronel Gregorio Albarracín Lanchipa', 'La Yarada-Los Palos'],
    Candarave: ['Candarave', 'Cairani', 'Camilaca', 'Curibaya', 'Huanuara', 'Quilahuani'],
    'Jorge Basadre': ['Ilabaya', 'Ite', 'Locumba'],
    Tarata: ['Tarata', 'Chucatamani', 'Estique', 'Estique-Pampa', 'Sitajara', 'Susapaya', 'Tarucachi', 'Ticaco']
  },
  Amazonas: {
    Chachapoyas: ['Chachapoyas', 'Asunción', 'Balsas', 'Cheto', 'Chiliquin', 'Chuquibamba', 'Granada', 'Huancas', 'La Jalca', 'Leimebamba', 'Levanto', 'Magdalena', 'Mariscal Castilla', 'Molinopampa', 'Montevideo', 'Olleros', 'Quinjalca', 'San Francisco de Daguas', 'San Isidro de Maino', 'Soloco', 'Sonche'],
    Bagua: ['Bagua', 'Aramango', 'Copallin', 'El Parco', 'Imaza', 'La Peca'],
    Bongará: ['Jumbilla', 'Chisquilla', 'Churuja', 'Corosha', 'Cuispes', 'Florida', 'Jazan', 'Recta', 'San Carlos', 'Shipasbamba', 'Valera', 'Yambrasbamba'],
    Condorcanqui: ['Nieva', 'El Cenepa', 'Río Santiago'],
    Luya: ['Lámud', 'Camporredondo', 'Cocabamba', 'Colcamar', 'Conila', 'Inguilpata', 'Longuita', 'Lonya Chico', 'Luya', 'Luya Viejo', 'María', 'Ocalli', 'Ocumal', 'Pisuquia', 'Providencia', 'San Cristóbal', 'San Francisco del Yeso', 'San Jerónimo', 'San Juan de Lopecancha', 'Santa Catalina', 'Santo Tomás', 'Tingo', 'Trita'],
    'Rodríguez de Mendoza': ['San Nicolás', 'Chirimoto', 'Cochamal', 'Huambo', 'Limabamba', 'Longar', 'Mariscal Benavides', 'Milpuc', 'Omia', 'Santa Rosa', 'Totora', 'Vista Alegre'],
    Utcubamba: ['Bagua Grande', 'Cajaruro', 'Cumba', 'El Milagro', 'Jamalca', 'Lonya Grande', 'Yamón']
  },
  Pasco: {
    Pasco: ['Chaupimarca (Cerro de Pasco)', 'Huachón', 'Huariaca', 'Huayllay', 'Ninacaca', 'Pallanchacra', 'Paucartambo', 'San Francisco de Asís de Yarusyacán', 'Simón Bolívar', 'Ticlacayán', 'Tinyahuarco', 'Vicco', 'Yanacancha'],
    'Daniel Alcides Carrión': ['Yanahuanca', 'Chacayán', 'Goyllarisquizga', 'Paucar', 'San Pedro de Pillao', 'Santa Ana de Tusi', 'Tapuc', 'Vilcabamba'],
    Oxapampa: ['Oxapampa', 'Chontabamba', 'Huancabamba', 'Palcazú', 'Pozuzo', 'Puerto Bermúdez', 'Villa Rica', 'Constitución']
  },
  Tumbes: {
    Tumbes: ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen'],
    'Contralmirante Villar': ['Zorritos', 'Casitas', 'Canoas de Punta Sal'],
    Zarumilla: ['Zarumilla', 'Aguas Verdes', 'Matapalo', 'Papayal']
  },
  Callao: {
    Callao: ['Callao (Cercado)', 'Bellavista', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Ventanilla', 'Mi Perú']
  }
}

// Helpers para consulta y filtrado jerárquico
export const getRegiones = (): string[] => {
  return Object.keys(UBIGEO_PERU).sort((a, b) => {
    // Cusco primero por contexto de campaña, luego alfabético
    if (a === 'Cusco') return -1
    if (b === 'Cusco') return 1
    return a.localeCompare(b, 'es')
  })
}

export const getProvincias = (region: string): string[] => {
  if (!region || !UBIGEO_PERU[region]) return []
  return Object.keys(UBIGEO_PERU[region]).sort((a, b) => {
    // Si es Cusco, Urubamba primero
    if (region === 'Cusco') {
      if (a === 'Urubamba') return -1
      if (b === 'Urubamba') return 1
    }
    return a.localeCompare(b, 'es')
  })
}

export const getDistritos = (region: string, provincia: string): string[] => {
  if (!region || !provincia || !UBIGEO_PERU[region] || !UBIGEO_PERU[region][provincia]) return []
  return UBIGEO_PERU[region][provincia]
}

