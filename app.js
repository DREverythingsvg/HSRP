/**
 * HSRP & FHRP Exam Master - Core Application Logic
 * Includes:
 * - Randomized quiz engine (both questions & choices randomized automatically)
 * - Interactive Cisco CLI command trainer & flashcards
 * - Full device configuration editor & syntax validator (ISP, MLS1, MLS2)
 * - Interactive Network Topologies with clickable node inspector
 * - Web Audio API sound effects
 */

// ==========================================
// 1. SOUND EFFECTS (Web Audio API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playTone(freq, type, duration, delay = 0) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(this.ctx.currentTime + delay);
      osc.stop(this.ctx.currentTime + delay + duration);
    } catch (e) {
      // Audio might fail if user hasn't interacted yet
    }
  }

  playCorrect() {
    this.playTone(523.25, 'sine', 0.12, 0);     // C5
    this.playTone(659.25, 'sine', 0.12, 0.08);  // E5
    this.playTone(783.99, 'sine', 0.22, 0.16);  // G5
  }

  playWrong() {
    this.playTone(280, 'sawtooth', 0.18, 0);
    this.playTone(220, 'sawtooth', 0.28, 0.12);
  }

  playClick() {
    this.playTone(400, 'triangle', 0.05, 0);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.2, idx * 0.1);
    });
  }
}

const sfx = new SoundFX();

// ==========================================
// 2. QUIZ QUESTION DATABASE (Based 100% on PDF)
// ==========================================
const MASTER_QUESTIONS = [
  {
    "id": 1,
    "category": "fhrp-intro",
    "importance": "★ VIKTIGAST TILL PROV",
    "question": "Vad står förkortningen FHRP för och vad är dess primära nätverksfunktion?",
    "options": [
      "First Hop Redundancy Protocols – erbjuder gateway-redundans så klienter inte tappar internet vid routerkrasch.",
      "Fast Host Routing Protocol – ökar överföringshastigheten mellan switchar och routrar på det lokala L2-nätverket.",
      "Forwarding Hop Redundant Path – dirigerar dynamiska rutter över internetleverantörens autonoma nätverk via BGP.",
      "Fixed Hardware Redundancy Protocol – styr reservströmförsörjning och fläktmoduler i Ciscos switch-infrastruktur."
    ],
    "correctIndex": 0,
    "explanation": "FHRP står för First Hop Redundancy Protocols. Syftet är att skapa en virtuell default gateway med redundans så att klienter behåller sin nätverksanslutning även om den primära routern fallerar.",
    "ref": "PDF Sida 1 & 3: 'Tre vanliga FHRP-protokoll / First Hop Redundancy Protocols'"
  },
  {
    "id": 2,
    "category": "fhrp-intro",
    "importance": "★ DETTA KOMMER PÅ PROV",
    "question": "Vilket av följande påståenden stämmer angående standarder för HSRP, VRRP och GLBP?",
    "options": [
      "HSRP och GLBP är proprietära Cisco-protokoll medan VRRP är en officiell öppen IETF-standard.",
      "VRRP och GLBP är öppna industristandarder medan HSRP är det enda slutna Cisco-protokollet.",
      "Samtliga tre FHRP-protokoll är öppna standarder som kan användas fritt på alla tillverkare.",
      "HSRP är en öppen standard definierad av IEEE medan VRRP och GLBP är proprietära Cisco-system."
    ],
    "correctIndex": 0,
    "explanation": "HSRP och GLBP utvecklades av Cisco och är Cisco-specifika protokoll, medan VRRP är en öppen standard från IETF.",
    "ref": "PDF Sida 3: 'HSRP cisco protokoll', 'VRRP öppen standard', 'GLBP cisco protokoll'"
  },
  {
    "id": 3,
    "category": "fhrp-intro",
    "importance": "★ ROLLER & LASTDELNING",
    "question": "Vilka roller och vilken princip för lastdelning definieras för Cisco HSRP?",
    "options": [
      "Roller: Active och Standby. Lastdelning: Endast en aktiv router per grupp hanterar all trafik.",
      "Roller: Active/Master och Backup. Lastdelning: Flera routrar hanterar datatrafiken samtidigt.",
      "Roller: AVG och AVF. Lastdelning: Flera routrar vidarebefordrar trafik via en round-robin-kö.",
      "Roller: Primary och Secondary. Lastdelning: Klienterna fördelas slumpmässigt per switchport."
    ],
    "correctIndex": 0,
    "explanation": "I HSRP finns rollerna Active och Standby (samt listen, speak, learn, initial). Endast en router är aktiv per grupp.",
    "ref": "PDF Sida 3: 'HSRP: Active standby... en aktiv router per grupp'"
  },
  {
    "id": 4,
    "category": "vrrp-glbp",
    "importance": "★ VRRP ROLLER & TRANSPORT",
    "question": "Vilka roller har VRRP och vilket protokollnummer används för transport?",
    "options": [
      "Roller: Master och Backup. VRRP skickar sina kontrollpaket direkt via IP-protokoll nummer 112.",
      "Roller: Active och Standby. VRRP skickar sina kontrollpaket inkapslade i UDP över porten 1985.",
      "Roller: AVG och AVF. VRRP skickar sina kontrollpaket via TCP över en specifik portkod 3222 här.",
      "Roller: Primary och Secondary. VRRP skickar sina kontrollpaket med ICMP typ 8 ekobegäran här."
    ],
    "correctIndex": 0,
    "explanation": "VRRP har rollerna Master och Backup och kommunicerar direkt över IP-lager med protokollnummer 112 (inte UDP/TCP!).",
    "ref": "PDF Sida 3: 'VRRP öppen standard IP-protokoll 112 master backup'"
  },
  {
    "id": 5,
    "category": "vrrp-glbp",
    "importance": "★ GLBP LASTBALANSERING",
    "question": "Vad kännetecknar GLBP gällande roller, UDP-port och vidarebefordran av trafik?",
    "options": [
      "Använder UDP 3222 med roller AVG och AVF där flera routrar kan vidarebefordra samtidigt i gruppen.",
      "Använder UDP 1985 med roller Active och Standby där endast en router vidarebefordrar datatrafiken.",
      "Använder IP-protokoll 112 med roller Master och Backup där en enda router sköter all paketrouting.",
      "Använder TCP 8080 med roller Primary och Replica där all datatrafik dupliceras över två länkpar."
    ],
    "correctIndex": 0,
    "explanation": "GLBP använder UDP-port 3222, har rollerna AVG (Active Virtual Gateway) och AVF (Active Virtual Forwarder), och erbjuder äkta lastbalansering där flera noder vidarebefordrar samtidigt.",
    "ref": "PDF Sida 3: 'GLBP cisco protokoll UDP-port 3222 AVG och AVF äkta lastbalansering flera routrar kan vidarebefordra samtidigt'"
  },
  {
    "id": 6,
    "category": "fhrp-intro",
    "importance": "★ KOMMER PÅ PROV: SPOF",
    "question": "Vad är en 'Single Point of Failure' (SPOF) enligt kursanteckningarna?",
    "options": [
      "En enskild komponent vars fel gör att en hel tjänst eller del av nätverket slutar fungera.",
      "En redundant switch som blockerar alternativa länkar för att förhindra skadliga nätloopar.",
      "Ett dynamiskt routingprotokoll som misslyckas med att annonsera externa rutter till grannar.",
      "En felaktigt krypterad länk mellan två routrar som orsakar paketförluster på Layer 3-nivå."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 1: 'En singel Point of failure spof är en enskild komponent vars fel gör att en tjänst eller en del av nätverket slutar fungera.'",
    "ref": "PDF Sida 1: 'Vad är en single Point failure kommer på prov?'"
  },
  {
    "id": 7,
    "category": "fhrp-intro",
    "importance": "★ KOMMER PÅ PROV: SPOF",
    "question": "Varför utgör en ensam router en SPOF även om switchar och länkar är redundanta?",
    "options": [
      "Om den ensamma routern dör förlorar alla lokala klienter genast kontakt med externa nätet.",
      "Switchen stänger automatiskt av alla sina fysiska portar om routern saknar redundant länk.",
      "Klienterna slutar genast att kommunicera internt på sitt eget lokala Layer 2-subnätverk.",
      "RSTP blockerar alla switchportar permanent eftersom nätet saknar en andra gateway-enhet här."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 1: 'Ett nätverk kan ha redundanta switchar och länkar på lager 2 men om det bara finns en enda router konfigurerad som default gateway mot externa nät, utgör den routern en SPOF. Om denna ensamma gateway-router slutar fungera, förlorar alla lokala klienter omedelbart sin anslutning till externa nätverket.'",
    "ref": "PDF Sida 1: 'om denna ensamma gateway-router slutar fungera...'"
  },
  {
    "id": 8,
    "category": "fhrp-intro",
    "importance": "★ REDUNDANS KRÄVER PROTOKOLL",
    "question": "Varför räcker det inte med att enbart installera extra fysisk utrustning för redundans?",
    "options": [
      "Det krävs aktiva nätverksprotokoll på både Layer 2 och Layer 3 som styr trafikvägarna vid fel.",
      "Utrustningen drar för mycket ström och kräver extra kylaggregat för att undvika överhettning.",
      "Operativsystemet på klientdatorerna vägrar godkänna anslutningar med mer än en fysisk kabel.",
      "Cisco-enheter tillåter aldrig att två fysiska routrar kopplas in till samma Layer 2-switch."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 1: 'Att enbart installera extra fysisk utrustning räcker inte för att uppnå full redundans. I traditionella switchade nätverk används protokoll som RSTP... på motsvarande sätt krävs det ett protokoll för gateway-redundans på IP-nivå (lager 3).'",
    "ref": "PDF Sida 1: 'Räcker extra utrustning för redundans?'"
  },
  {
    "id": 9,
    "category": "fhrp-intro",
    "importance": "★ L2 RSTP VS L3 FHRP",
    "question": "Hur skiljer sig hanteringen av redundans mellan Layer 2 (RSTP) och Layer 3 (FHRP)?",
    "options": [
      "RSTP häver loopar och öppnar reservlänkar på L2, medan FHRP låter reservrouter ta över på L3.",
      "RSTP delar ut dynamiska IP-adresser på L2, medan FHRP krypterar all användardata på Layer 3.",
      "RSTP tilldelar unika MAC-adresser på L2, medan FHRP konfigurerar statiska DNS-servrar på L3.",
      "RSTP övervakar serverhallens brandväggar, medan FHRP enbart hanterar trådlösa accesspunkter."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 1: På Layer 2 används RSTP för att förhindra loopar genom att blockera redundanta vägar och öppna dem vid fel. På Layer 3 krävs FHRP så att en reservrouter omedelbart kan ta över rollen som standard-gateway.",
    "ref": "PDF Sida 1: 'RSTP för att förhindra loopar... protokoll för gateway-redundans på IP-nivå (lager 3)'"
  },
  {
    "id": 10,
    "category": "fhrp-intro",
    "importance": "★ KOMMER PÅ PROV: FIRST HOP",
    "question": "Vad menas med begreppet 'det första hoppet' (First Hop) enligt provfrågan?",
    "options": [
      "Den allra första Layer 3-enheten som ett IP-paket passerar på väg ut från det lokala nätet.",
      "Den första Layer 2-switchen som tar emot Ethernet-ramen från klientens lokala nätverkskort.",
      "Den första brandväggen hos internetleverantören som filtrerar inkommande och utgående paket.",
      "Den lokala DHCP-server som tilldelar klienten dess subnätmask och primära IP-inställning."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 2: 'Det första hoppet (first hop) definieras som den allra första L3-enheten (en router eller en L3-switch) som ett IP-paket passerar på sin väg utanför det lokala nätverket. För en vanlig klientdator eller server innebär detta hoppet till dess konfigurerade default gateway.'",
    "ref": "PDF Sida 2: 'Vad menas med det första hoppet rubrik'"
  },
  {
    "id": 11,
    "category": "fhrp-intro",
    "importance": "★ L2-SWITCH EJ FIRST HOP",
    "question": "Varför räknas en vanlig Layer 2-switch INTE som det första hoppet för IP-paketet?",
    "options": [
      "En L2-switch vidarebefordrar bara Ethernet-ramar och läser inte IP-adresser på nätverkslagret.",
      "En L2-switch har ingen strömförsörjning och kan inte bearbeta datapaket i realtid på nätet.",
      "En L2-switch blockerar alltid paket som försöker skickas till destinationer utanför LAN:et.",
      "En L2-switch saknar helt fysiska MAC-adresser och kan därför inte ingå i paketförmedlingen."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 2: Första hoppet är en L3-enhet (router/L3-switch). En vanlig L2-switch arbetar uteslutande på datalänklagret (Layer 2) och dirigerar ramar baserat på MAC-adresser, inte IP-adresser.",
    "ref": "PDF Sida 2: 'det första hoppet definieras som den allra första L3-enheten... en vanlig L2-switch'"
  },
  {
    "id": 12,
    "category": "fhrp-intro",
    "importance": "★ STATISK GATEWAY RISK",
    "question": "Vad är problemet om en klient har en statiskt inställd router-IP som default gateway?",
    "options": [
      "Klienten blir bunden till den routern och kan inte själv byta till reserven om den dör.",
      "Klienten kommer automatiskt att radera sitt operativsystem om nätverkskabeln kopplas ur.",
      "Klientens nätverkskort överbelastas av broadcast-paket och kraschar inom några sekunder.",
      "Switchen förväxlar klientens MAC-adress med routern och stänger av porten via port-lås."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 2: 'Om en klient är statiskt inställd på att använda en specifik routers IP-adress som gateway, blir den helt beroende av den specifika enheten. Klienten kan inte på egen hand växla över till en annan tillgänglig router om den primära slutar fungera.'",
    "ref": "PDF Sida 2: 'om en klient är statisk inställd...'"
  },
  {
    "id": 13,
    "category": "hsrp-core",
    "importance": "★ GEMENSAM VIRTUELL GATEWAY",
    "question": "Hur löser HSRP problemet med gateway-beroende för klienterna på det lokala nätet?",
    "options": [
      "Flera fysiska routrar samverkar och agerar som en enda gemensam virtuell router med delad VIP.",
      "Klienten kör ett eget routingprotokoll som byter default gateway varje gång en ping förloras.",
      "Switchen tilldelar automatiskt två helt separata default gateways till varje enskild klient.",
      "DNS-servern uppdaterar klientens gateway-adress var tionde sekund via dynamiska SRV-poster."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 4: 'Med HSRP kan två eller flera fysiska routrar gå samman och presentera sig som en enda gemensam virtuell router för klienterna på nätverket. Den virtuella routern tilldelas en unik virtuell IP-adress (VIP) samt en matchande virtuell MAC-adress (VMAC).'",
    "ref": "PDF Sida 4: 'HSRP - en gemensam virtuell gateway'"
  },
  {
    "id": 14,
    "category": "hsrp-core",
    "importance": "★ EGNA VS VIRTELLA IP",
    "question": "Vad gäller för routrarnas egna fysiska IP-adresser i en konfigurerad HSRP-grupp?",
    "options": [
      "Varje router behåller sin unika fasta fysiska IP-adress på interfacet utöver den delade VIP:n.",
      "Routrarnas fysiska IP-adresser raderas helt och ersätts uteslutande av den virtuella adressen.",
      "Alla routrar i gruppen tvingas konfigurera exakt samma fysiska IP-adress på sina interface.",
      "Fysiska IP-adresser ersätts av privata MAC-adresser som genereras slumpmässigt vid omstart."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 4: 'Egna och virtuella IP-adresser i HSRP: varje L3-switch eller router i en HSRP-grupp behåller sin unika, fasta IP-adress på sitt interface (t.ex. R1 har 10.1.1.2 och R2 har 10.1.1.3).'",
    "ref": "PDF Sida 4: 'egna och virtuella ip addresser i hsrp'"
  },
  {
    "id": 15,
    "category": "hsrp-core",
    "importance": "★ FORMAT PÅ VMAC",
    "question": "Vilket format har den virtuella MAC-adressen i HSRPv1 och HSRPv2 för IPv4?",
    "options": [
      "HSRPv1 använder formatet 0000.0c07.acXX och HSRPv2 för IPv4 använder 0000.0c9f.fXXX i nätet.",
      "HSRPv1 använder formatet 0000.0c9f.fXXX och HSRPv2 för IPv4 använder 0000.0c07.acXX i nätet.",
      "HSRPv1 använder formatet 0000.5e00.01XX och HSRPv2 för IPv4 använder 0007.0c01.acXX i nätet.",
      "HSRPv1 använder formatet ffff.0c07.acXX och HSRPv2 för IPv4 använder 0000.ffff.fXXX i nätet."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 5 & 8: 'HSRPv1 använder formatet 0000.0c07.acXX. HSRPv2 för IPv4 använder formatet 0000.0c9f.fXXX. XX eller XXX är gruppnumret uttryckt i hexadecimal form.'",
    "ref": "PDF Sida 5: 'Den virtuella mac-addressen' & Sida 8"
  },
  {
    "id": 16,
    "category": "mac-calc",
    "importance": "★ PROVEXEMPEL: GRUPP 150",
    "question": "Vilken virtuell MAC-adress skapas i HSRPv1 för grupp 150 (beräkna 150 i hex)?",
    "options": [
      "0000.0c07.ac96 (eftersom 150 delat med 16 ger kvoten 9 och resten 6, vilket bildar talet 96).",
      "0000.0c07.ac0a (eftersom 150 delat med 16 ger kvoten 10 och resten 0, vilket bildar koden 0A).",
      "0000.0c07.acff (eftersom 150 delat med 16 ger kvoten 15 och resten 15, vilket bildar koden FF).",
      "0000.0c9f.f150 (eftersom gruppnumret 150 alltid skrivs ut i decimal form utan omvandling här)."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 5: 'Group 150: 150/16 = 9 och rest 6, då kommer vi ha 9 och 6, MAC-adressen blir 0000.0c07.AC96.'",
    "ref": "PDF Sida 5: 'Group 150: 150/16 = 9 och rest 6... 0000.0c07.AC96'"
  },
  {
    "id": 17,
    "category": "mac-calc",
    "importance": "★ PROVEXEMPEL: GRUPP 255 & 10",
    "question": "Vilka virtuella MAC-adresser skapas i HSRPv1 för grupp 10 respektive grupp 255?",
    "options": [
      "Grupp 10 ger 0000.0c07.ac0a och grupp 255 ger 0000.0c07.acff (10 är 0A och 255 är FF i hex).",
      "Grupp 10 ger 0000.0c07.ac10 och grupp 255 ger 0000.0c07.ac99 (10 är 10 och 255 är 99 i hex).",
      "Grupp 10 ger 0000.0c9f.f010 och grupp 255 ger 0000.0c9f.ffff (10 är 10 och 255 är FF i hex).",
      "Grupp 10 ger 0000.5e00.010a och grupp 255 ger 0000.5e00.01ff (10 är 0A och 255 är FF i hex)."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 5: 'Grupp 10 blir 0A: HSRPv1 använder 0000.0c07.ac0a. Grupp 255: 255/16 = 15 rest 15 -> 0000.0c07.ACFF.'",
    "ref": "PDF Sida 5: 'grupp 10 blir 0A... grupp 255 255/16 = 15 rest 15 0000.0C07.ACFF'"
  },
  {
    "id": 18,
    "category": "mac-calc",
    "importance": "★ OFÖRÄNDRAD VMAC VID FEL",
    "question": "Vad gäller för den virtuella MAC-adressen när standby-routern tar över rollen som Active?",
    "options": [
      "Den virtuella MAC-adressen är densamma så klienterna slipper uppdatera sina ARP-tabeller.",
      "Den virtuella MAC-adressen byts direkt ut mot reservrouterns unika fysiska hårdvaruadress.",
      "Den virtuella MAC-adressen raderas och alla klienter måste starta om sina nätverkskort.",
      "Den virtuella MAC-adressen omvandlas till en broadcast-adress under en minut vid växling."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 5: 'Den virtuella MAC-adressen är densamma även när en router tar över i Active.' Detta gör failover helt transparent för klienterna!",
    "ref": "PDF Sida 5: 'den virtuella mac-addressen är densamma även när en router tar över i Active'"
  },
  {
    "id": 19,
    "category": "mac-calc",
    "importance": "★ ARP OCH GATEWAY",
    "question": "Vad händer när en dator gör ARP-förfrågan ('vem har 192.168.1.1?') i en HSRP-grupp?",
    "options": [
      "HSRP:s Active router svarar med gruppens virtuella MAC-adress (t.ex. 0000.0c07.ac96).",
      "Både Active och Standby svarar samtidigt med sina respektive fysiska port-MAC-adresser.",
      "Standby-routern svarar med VIP medan den aktiva routern förblir tyst för att spara CPU.",
      "Access-switchen svarar med sin egen loopback-MAC för att avlasta båda Layer 3-routrarna."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 6: 'När en dator ska skicka trafik till sin default gateway gör den ARP: vem har 192.168.1.1? HSRP:s Active router svarar med HSRP-gruppens virtuella MAC-adress (0000.0c07.ac96).'",
    "ref": "PDF Sida 6: 'vem har 192.168.1.1? HSRP:S Active router svarar med hsrp-gruppens virtuella mac-address'"
  },
  {
    "id": 20,
    "category": "mac-calc",
    "importance": "★ KOMMER PÅ PROV: ARP -A",
    "question": "Vad visas i Windows-kommandotolken via 'arp -a' för default gateway i ett HSRP-nätverk?",
    "options": [
      "Den virtuella IP-adressen (VIP) visas dynamiskt bunden till gruppens virtuella MAC-adress.",
      "Den fysiska routerns serienummer visas dynamiskt kopplat till switchportens VLAN-nummer.",
      "Internetleverantörens publika IP-adress visas dynamiskt kopplad till klientens eget kort.",
      "Gateway-adressen visas helt tom i listan eftersom HSRP döljer alla lokala ARP-tabeller."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 7: 'C:/Users/gonriv> arp -a ... 10.1.1.1 00-00-0c-07-ac-01 dynamic'. Gatewayens IP kopplas dynamiskt till HSRP:s virtuella MAC.",
    "ref": "PDF Sida 7: 'arp -a / 10.1.1.1 00-00-0c-07-ac-01 dynamic'"
  },
  {
    "id": 21,
    "category": "mac-calc",
    "importance": "★ DESTINATIONS-IP INTRAKT",
    "question": "Hur adresseras Ethernet-ramen och IP-paketet när en klient skickar data ut på internet?",
    "options": [
      "Ethernet-ramen skickas till gatewayens VMAC medan IP-paketets destinations-IP är slutservern.",
      "Både Ethernet-ramen och IP-paketet adresseras direkt till den aktiva routerns fysiska port.",
      "Ethernet-ramen adresseras till broadcast (FFFF) medan destinations-IP sätts till noll i ramen.",
      "Ethernet-ramen skickas till klientens egen MAC medan destinations-IP sätts till VIP på nätet."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 7: 'Klienten skickar Ethernet-ramen till den virtuella MAC-adressen. Paketets destinations-IP är fortfarande den slutliga mottagarens IP-adress. Den aktiva routern använder sin routingtabell för att vidarebefordra paketet.'",
    "ref": "PDF Sida 7: 'paketets destinations-ip är fortfarande den slutliga mottagarens ip-address'"
  },
  {
    "id": 22,
    "category": "hsrp-core",
    "importance": "★ STANDBY TAR EJ TRAFIK",
    "question": "Hur agerar Standby-routern när klienter skickar vanlig datatrafik till gatewayens VIP?",
    "options": [
      "Standby-routern tar inte emot eller vidarebefordrar denna trafik, utan övervakar Active.",
      "Standby-routern vidarebefordrar exakt hälften av alla TCP-sessioner via sin egen upplänk.",
      "Standby-routern lagrar all klienttrafik i en intern kö tills Active bekräftar mottagning.",
      "Standby-routern skickar tillbaka ICMP Redirect till klienten och stänger ner interfacet."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 7: 'Standby server tar inte emot denna typ av trafik.' All klienttrafik hanteras uteslutande av den aktiva routern.",
    "ref": "PDF Sida 7: 'standby server tar inte emot denna typ av trafik'"
  },
  {
    "id": 23,
    "category": "hsrp-core",
    "importance": "★ HSRPV1 VS HSRPV2",
    "question": "Vilka gruppnummer och multicast-adresser skiljer HSRPv1 från HSRPv2 för IPv4?",
    "options": [
      "v1 stödjer grupper 0-255 med IP 224.0.0.2; v2 stödjer grupper 0-4095 med IP 224.0.0.102.",
      "v1 stödjer grupper 0-4095 med IP 224.0.0.102; v2 stödjer grupper 0-255 med IP 224.0.0.2.",
      "v1 stödjer grupper 1-100 med IP 224.0.0.18; v2 stödjer grupper 1-1000 med IP 224.0.0.9.",
      "Båda versionerna stödjer 65535 grupper och skickar broadcast (255.255.255.255) på nätet."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 8: 'HSRPv1: stöder gruppnummer 0-255, multicast 224.0.0.2. HSRPv2: stöder gruppnummer 0-4095 (täcker hela VLAN-intervallet), multicast 224.0.102.'",
    "ref": "PDF Sida 8: 'HSRP version 1 kontra version 2'"
  },
  {
    "id": 24,
    "category": "hsrp-core",
    "importance": "★ HSRPV2 IPV6 & TIMERS",
    "question": "Vilka ytterligare förbättringar erbjuder HSRPv2 utöver fler grupper enligt anteckningarna?",
    "options": [
      "Inbyggt stöd för timers i millisekunder samt IPv6-redundans med FF02::66 och UDP 2029.",
      "Automatisk konfiguration utan IP-adressering samt integrerad brandvägg på Layer 2-nivå.",
      "Ersättning av alla Cisco CLI-kommandon med ett webbaserat gränssnitt via HTTPS-port 443.",
      "Kompression av datapaket med 50% samt full bakåtkompatibilitet med AppleTalk-protokoll."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 8: 'HSRPv2 har inbyggt stöd för timers i millisekunder. Stöder IPv6-redundans med multicast-adressen FF02::66 och UDP-port 2029.'",
    "ref": "PDF Sida 8: 'har inbyggt stöd för timers i millisekunder. stöder ipv6-redundans...'"
  },
  {
    "id": 25,
    "category": "hsrp-states",
    "importance": "★ 6 TILLSTÅND TILL PROV",
    "question": "Vilka är HSRP:s 6 tillstånd i exakt rätt kronologisk ordningsföljd?",
    "options": [
      "Initial ➔ Learn ➔ Listen ➔ Speak ➔ Standby ➔ Active i en obruten sekventiell följd.",
      "Initial ➔ Listen ➔ Learn ➔ Speak ➔ Active ➔ Standby i en obruten sekventiell följd.",
      "Learn ➔ Listen ➔ Speak ➔ Standby ➔ Active ➔ Initial i en obruten sekventiell följd.",
      "Initial ➔ Speak ➔ Listen ➔ Learn ➔ Standby ➔ Active i en obruten sekventiell följd."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 9: De 6 tillstånden är: Initial, Learn, Listen, Speak, Standby, Active.",
    "ref": "PDF Sida 9 & 10: 'HSRP 6 tillstånd states'"
  },
  {
    "id": 26,
    "category": "hsrp-states",
    "importance": "★ TILLSTÅND: INITIAL & LEARN",
    "question": "Vad innebär tillståndet 'Initial' respektive 'Learn' enligt provanteckningarna?",
    "options": [
      "Initial: HSRP har ej startat; Learn: väntar på hello för att lära sig virtuell IP-adress.",
      "Initial: routern skickar ARP; Learn: routern sparar konfigurationen permanent i NVRAM.",
      "Initial: routern vidarebefordrar data; Learn: routern lyssnar passivt på klienters DNS.",
      "Initial: interfacet är nere; Learn: routern utser omedelbart sig själv till Active-nod."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 9: 'Initial: utgångsläget där HSRP ännu inte har startat eller interfacet precis har kommit upp. Learn: enheten väntar på att ta emot hello-paket från den aktiva routern för att lära sig den virtuella IP-adressen om den inte är statiskt satt.'",
    "ref": "PDF Sida 9: 'Inital... Leearn...'"
  },
  {
    "id": 27,
    "category": "hsrp-states",
    "importance": "★ TILLSTÅND: LISTEN & SPEAK",
    "question": "Vad innebär tillståndet 'Listen' respektive 'Speak' enligt provanteckningarna?",
    "options": [
      "Listen: känner till VIP och lyssnar passivt; Speak: börjar aktivt skicka egna hello-paket.",
      "Listen: skickar aktiva hellos; Speak: lyssnar passivt på routingtabeller från ISP-routern.",
      "Listen: vidarebefordrar hälften av paketen; Speak: tar över ansvaret för all klienttrafik.",
      "Listen: stänger av gränssnittet vid fel; Speak: loggar alla tillståndsändringar via syslog."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 9: 'Listen: enheten känner till den virtuella IP-adressen men är varken Active eller Standby. Den lyssnar passivt på hello-meddelanden från de andra. Speak: enheten börjar aktivt skicka ut egna hello-meddelanden och deltar i valprocessen.'",
    "ref": "PDF Sida 9: 'Listen... Speak...'"
  },
  {
    "id": 28,
    "category": "hsrp-states",
    "importance": "★ TILLSTÅND: STANDBY & ACTIVE",
    "question": "Hur definieras rollerna 'Standby' och 'Active' under HSRP-processens sista tillstånd?",
    "options": [
      "Standby: vald reserv som övervakar Active; Active: enhet som tagit på sig ledarrollen.",
      "Standby: hanterar IPv6-trafik; Active: hanterar IPv4-trafik uteslutande på gränssnittet.",
      "Standby: vidarebefordrar alla paket; Active: agerar backup om standby-enheten kraschar.",
      "Standby: blockerar alla portar; Active: utför dynamisk routning mot externa system här."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 10: 'Standby: enheten har valts till reserv. Den övervakar kontinuerligt den aktiva routern och är redo att ta över när den aktiva routern bedöms vara otillgänglig. Active: enheten har tagit på sig ledarrollen.'",
    "ref": "PDF Sida 10: 'hsrp 6 tillstånd states- standby och Active'"
  },
  {
    "id": 29,
    "category": "hsrp-core",
    "importance": "★ PRIORITET INTERVALL & DEFAULT",
    "question": "Vilket intervall kan HSRP-prioritet konfigureras med och vad är standardvärdet?",
    "options": [
      "Prioritet konfigureras mellan 0 och 255 och standardvärdet på ett gränssnitt är 100.",
      "Prioritet konfigureras mellan 1 och 100 och standardvärdet på ett gränssnitt är 500.",
      "Prioritet konfigureras mellan 0 och 4095 och standardvärdet på ett gränssnitt är 100.",
      "Prioritet konfigureras mellan 1 och 65535 och standardvärdet på ett gränssnitt är 10."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 10: 'Ett HSRP-interface kan konfigureras med en prioritet mellan 0 och 255. Standardvärdet är 100. Vid val av roll Active vinner interfacet med högsta prioritet.'",
    "ref": "PDF Sida 10: 'HSRP-prioritet och preemption'"
  },
  {
    "id": 30,
    "category": "hsrp-core",
    "importance": "★ TIE-BREAKER VID SAMMA PRIO",
    "question": "R1 (10.1.1.2) och R2 (10.1.1.3) har båda prioritet 100. Vem blir Active och varför?",
    "options": [
      "R2 vinner eftersom R2 har den högsta fysiska IP-adressen (10.1.1.3 är högre än 10.1.1.2).",
      "R1 vinner eftersom R1 har den lägsta fysiska IP-adressen (10.1.1.2 är lägre än 10.1.1.3).",
      "Ingen vinner utan routern som har lägst MAC-adress utses automatiskt till aktiv router.",
      "Båda routrarna blir Active samtidigt och delar upp alla klienter 50/50 via round-robin."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 10: 'Om två enheter har samma prioritet blir den enhet som har högsta fysisk IP-adress Active. r1 10.1.1.2, r2 10.1.1.3 -> R2 vinner.'",
    "ref": "PDF Sida 10: 'om två enheter har samma prioritet blir den enhet som har högsta fysisk ip address Active'"
  },
  {
    "id": 31,
    "category": "hsrp-core",
    "importance": "★ FAILOVER & OMSTART UTAN PREEMPT",
    "question": "Vad händer när den tidigare aktiva routern startar om ifall 'preempt' INTE är aktiverat?",
    "options": [
      "Den tar INTE tillbaka Active-rollen automatiskt, även om den har högre prioritet i gruppen.",
      "Den tar OMEDELBART tillbaka rollen som Active så fort dess första hello-paket skickas ut.",
      "Den stänger av sitt gränssnitt helt på grund av en konflikt med den aktiva routern på LAN.",
      "Den tvingar den andra routern att starta om för att nollställa hela valprocessen på nätet."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 11: 'Vad händer när den tidigare aktiva routern startar igen? Tar den tillbaka Active? Nej, även om den har högre prioritet! Med standby preempt aktiverat på routern med högre prioritet kan den ta tillbaka rollen som Active.'",
    "ref": "PDF Sida 11: 'Vad händer om den aktiva routern slutar fungera'"
  },
  {
    "id": 32,
    "category": "hsrp-core",
    "importance": "★ KOMMER PÅ PROV: TIMER-REGEL",
    "question": "Vad är standardvärdena för HSRP timers och vilken formel måste du kunna på provet?",
    "options": [
      "Hello är 3s och Hold är 10s; Hold-timern bör vara minst tre gånger så stor som Hello i nätet.",
      "Hello är 10s och Hold är 3s; Hello-timern bör vara minst tre gånger så stor som Hold i nätet.",
      "Hello är 1s och Hold är 2s; Hold-timern måste alltid vara exakt dubbelt så stor som Hello här.",
      "Hello är 5s och Hold är 5s; båda parametrarna måste alltid vara exakt identiska i sekunder här."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 11: 'Hello-timern är normalt 3 sekunder... Hold-timern är normalt 10 sekunder... Den blir cirka 3 gånger större än hello-timern (3*3+1=10) kommer på prov du måste kunna räkna ut. Hold-timern bör vara minst tre gånger hello-timern.'",
    "ref": "PDF Sida 11: 'hsrp timers och anpassning av omkopplingstid / minst tre gånger hello'"
  },
  {
    "id": 33,
    "category": "hsrp-core",
    "importance": "★ VARFÖR HOLD 3X HELLO",
    "question": "Varför bör Hold-timern i HSRP alltid konfigureras till minst tre gånger Hello-timern?",
    "options": [
      "Det minskar risken för onödiga rollbyten vid hög nätverksbelastning eller tappade paket.",
      "Det säkerställer att switchens STP-konvergens inte blockerar portar på access-nivån här.",
      "Det är ett krav från IEEE för att tillåta routning av multicast-trafik över Ethernet.",
      "Det förhindrar att klientdatorernas operativsystem kraschar vid snabba failover-byten."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 11: 'Hold-timern bör vara minst tre gånger hello-timern. Det minskar risken för onödiga rollbyten vid hög belastning eller förlorade meddelanden.'",
    "ref": "PDF Sida 11: 'det minskar risken för onödiga rollbyten vid hög belastning'"
  },
  {
    "id": 34,
    "category": "hsrp-core",
    "importance": "★ SNABBARE TIMERS",
    "question": "Hur kan HSRP-timers anpassas för snabbare failover enligt anteckningarnas exempel?",
    "options": [
      "Genom att konfigurera kortare timers som t.ex. Hello 1 sekund och Hold 3 sekunder på porten.",
      "Genom att stänga av Hello-meddelanden helt och hållet och enbart förlita sig på ARP i LAN:et.",
      "Genom att konfigurera Hello till 10 sekunder och Hold-timern till 30 sekunder på interfacet.",
      "Genom att öka nätverkskabelns klockfrekvens från 100 MHz till 1000 MHz i switch-hårdvaran."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 11: 'Kortare timers ger snabbare övertagande, exempelvis hello 1 sekund och hold 3 sekunder.'",
    "ref": "PDF Sida 11: 'kortare timers ger snabbare övertagande, exempelvis hello 1 sekund och hold 3 sekunder'"
  },
  {
    "id": 35,
    "category": "topology-cli",
    "importance": "★ INTERFACE TRACKING",
    "question": "Vad är huvudsyftet med interface tracking i HSRP enligt kursanteckningarna?",
    "options": [
      "Att övervaka routerns uplink mot ISP och sänka prioriteten vid fel för att undvika black holes.",
      "Att logga samtliga användares webbhistorik till en central syslog-server hos administratören.",
      "Att mäta kabeldämpning på switchporten och varna om överföringshastigheten sjunker under 1G.",
      "Att blockera obehöriga MAC-adresser från att ansluta till nätverket via IEEE 802.1X-kontroll."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 12: 'Interface tracking - skydd mot brutna uplinks (black holes): genom att konfigurera interface tracking kan HSRP-processen instrueras att kontinuerligt övervaka statusen på routerns uplink.' Om uplänken dör sänks prioriteten så att standby kan ta över med preemption.",
    "ref": "PDF Sida 12: 'interface tracing-skydd mot brutna uplinks (black holes)'"
  },
  {
    "id": 36,
    "category": "topology-cli",
    "importance": "★ TRACKING BEGRÄNSNING",
    "question": "Vad är en begränsning med grundläggande interface tracking enligt anteckningarna?",
    "options": [
      "Den upptäcker bara om det lokala gränssnittet går ner; fel längre bort kräver annan koll.",
      "Den fungerar uteslutande på trådlösa gränssnitt och stöds inte på vanliga Gigabit-länkar.",
      "Den kan inte kombineras med kommandot standby preempt utan kräver manuell omstart här.",
      "Den sänker routerns prioritet till noll och gör att routern aldrig kan bli aktiv igen här."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 12: 'Interface-övervakningen upptäcker att det övervakade interfacet går ner. Ett fel längre bort i nätverket kan kräva annan övervakning (t.ex. IP SLA object tracking).'",
    "ref": "PDF Sida 12: 'ett fel längre bort i nätverket kan kräva annan övervakning'"
  },
  {
    "id": 37,
    "category": "hsrp-core",
    "importance": "★ UDP-PORT HSRP",
    "question": "Vilken specifik UDP-port används av HSRP för att skicka sina hello-meddelanden?",
    "options": [
      "UDP-port 1985 används av HSRP för att kommunicera hello-meddelanden mellan routrarna.",
      "UDP-port 520 används av HSRP för att kommunicera hello-meddelanden mellan routrarna.",
      "UDP-port 67 används av HSRP för att kommunicera hello-meddelanden mellan routrarna.",
      "UDP-port 3222 används av HSRP för att kommunicera hello-meddelanden mellan routrarna."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 3: HSRP skickar kontrollpaket över UDP på port 1985.",
    "ref": "PDF Sida 3: 'HSRP cisco protokoll UDP PORT 1985'"
  },
  {
    "id": 38,
    "category": "hsrp-core",
    "importance": "★ KOMMER PÅ PROV: VMAC V2",
    "question": "Vilken virtuell MAC-adress används för HSRP version 2 (HSRPv2) i grupp 1?",
    "options": [
      "0000.0c9f.f001 används som virtuell MAC-adress för HSRPv2 IPv4 i grupp 1 på nätverket.",
      "0000.0c07.ac01 används som virtuell MAC-adress för HSRPv2 IPv4 i grupp 1 på nätverket.",
      "0000.5e00.0101 används som virtuell MAC-adress för HSRPv2 IPv4 i grupp 1 på nätverket.",
      "0007.0c9f.ffff används som virtuell MAC-adress för HSRPv2 IPv4 i grupp 1 på nätverket."
    ],
    "correctIndex": 0,
    "explanation": "I HSRPv2 har den virtuella MAC-adressen formatet 0000.0c9f.fXXX där de tre sista siffrorna är gruppnumret i hex. Grupp 1 har alltså 0000.0c9f.f001! (HSRPv1 använde 0000.0c07.acXX).",
    "ref": "PDF Sida 5 & 8: 'HSRPv2 för ipv4 använder formatet 0000.0c9f.fXXX'"
  },
  {
    "id": 39,
    "category": "hsrp-core",
    "importance": "★ KOMMER PÅ PROV: PREEMPT",
    "question": "Vad gör kommandot 'standby <grupp> preempt' på ett HSRP-gränssnitt?",
    "options": [
      "Låter routern ta över som Active om dess prioritet är högre än nuvarande aktiv router.",
      "Tvingar routern att stänga ner sitt gränssnitt om en annan router upptäcks på nätverket.",
      "Raderar all HSRP-konfiguration från routerns minne om ett länkavbrott inträffar lokalt.",
      "Förhindrar andra routrar från att överhuvudtaget kommunicera på samma Layer 2-VLAN här."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 11: Preemption jämför prioritet och tillåter en router med högre prioritet att ta tillbaka ledarrollen som Active.",
    "ref": "PDF Sida 11: 'med standby preempt aktiverat på routern med högre prioritet kan den ta tillbaka rollen som Active'"
  },
  {
    "id": 40,
    "category": "vrrp-glbp",
    "importance": "★ DETTA KOMMER PÅ PROV",
    "question": "Vilken standardprioritet har VRRP och vilken prioritet har adressägaren (IP owner)?",
    "options": [
      "Standardprioritet är 100 och adressägaren (IP owner) har alltid högsta prioritet 255.",
      "Standardprioritet är 1 och adressägaren (IP owner) har alltid standardprioriteten 100.",
      "Standardprioritet är 255 och adressägaren (IP owner) har alltid lägsta prioriteten 0.",
      "VRRP saknar helt prioritetsfält och lottar ut ledarrollen slumpmässigt vid uppstart."
    ],
    "correctIndex": 0,
    "explanation": "I VRRP är standardprioriteten 100, medan routern som äger den faktiska IP-adressen har prioritet 255.",
    "ref": "Anteckningar & Provguide: VRRP standardprioritet 100, adressägare 255"
  },
  {
    "id": 41,
    "category": "vrrp-glbp",
    "importance": "★ GLBP ROLLER",
    "question": "Vad är den specifika uppgiften för en AVG (Active Virtual Gateway) i GLBP?",
    "options": [
      "Den svarar på klienters ARP-förfrågningar och delar ut olika virtuella MAC-adresser.",
      "Den stänger ner switchportar som överbelastas med hjälp av spanning-tree protokoll.",
      "Den krypterar samtlig användardata mellan klienten och routern via en IPsec-tunnel.",
      "Den agerar uteslutande standby-reserv och vidarebefordrar aldrig några datapaket alls."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 3: AVG svarar på klienternas ARP-förfrågningar och fördelar trafiken till AVF:er.",
    "ref": "PDF Sida 3: 'AVG (Active virtual gateway) och AVF'"
  },
  {
    "id": 42,
    "category": "vrrp-glbp",
    "importance": "★ GLBP METOD",
    "question": "Vilken standardmetod används av GLBP för att dela ut MAC-adresser till klienter?",
    "options": [
      "Round-robin används som standardmetod för att dela ut MAC-adresser i strikt turordning.",
      "Host-dependent används som standardmetod för att binda varje klient permanent vid IP.",
      "Weighted random används som standardmetod baserat på aktuell processorbelastning i CPU.",
      "First come first served används som standardmetod utan återanvändning av MAC-adresser."
    ],
    "correctIndex": 0,
    "explanation": "Standardmetoden i GLBP är Round-robin, där MAC-adresser delas ut i turordning.",
    "ref": "Anteckningar & Provguide: GLBP Round-robin"
  },
  {
    "id": 43,
    "category": "topology-cli",
    "importance": "★ GLOBAL ROUTING",
    "question": "Vilket globalt kommando måste ALLTID köras på en Cisco L3-switch för att den ska routa?",
    "options": [
      "ip routing måste alltid köras i globalt konfigurationsläge för att aktivera IP-routing.",
      "router rip måste alltid köras i globalt konfigurationsläge för att aktivera IP-routing.",
      "routing enable måste köras i globalt konfigurationsläge för att aktivera IP-routing här.",
      "ip forward-protocol måste köras i globalt konfigurationsläge för att aktivera IP-routing."
    ],
    "correctIndex": 0,
    "explanation": "Cisco Layer 3-switchar kräver 'ip routing' i global configuration mode för att aktivera IP-routing.",
    "ref": "Lab-konfiguration: 'MLS1(config)#ip routing'"
  },
  {
    "id": 44,
    "category": "topology-cli",
    "importance": "★ ROUTAD L3 PORT",
    "question": "Hur konverterar man en fysisk switchport (t.ex. g1/0/3) till ett routat L3-gränssnitt?",
    "options": [
      "no switchport körs under interfacet för att ta bort L2 och göra porten till en L3-port.",
      "switchport mode routed körs under interfacet för att ta bort L2 och göra porten till L3.",
      "ip routed-interface körs under interfacet för att ta bort L2 och göra porten till L3.",
      "routing port enable körs under interfacet för att ta bort L2 och göra porten till L3."
    ],
    "correctIndex": 0,
    "explanation": "Kommandot 'no switchport' tar bort Layer 2-egenskaperna och möjliggör tilldelning av en IP-adress direkt på porten.",
    "ref": "Lab-konfiguration: 'ISP(config-if)#no switchport'"
  },
  {
    "id": 45,
    "category": "topology-cli",
    "importance": "★ INTERFACE TRACKING SYNTAX",
    "question": "Vad gör kommandot 'standby 10 track g1/0/3' på MLS1 i labbkonfigurationen?",
    "options": [
      "Om uplänken g1/0/3 går ner sänks MLS1:s prioritet så att MLS2 kan ta över som Active.",
      "Det speglar all inkommande trafik på port g1/0/3 till en nätverksanalysator via SPAN.",
      "Det stänger av HSRP permanent på interfacet om port g1/0/3 råkar flappa tre gånger.",
      "Det krypterar alla datapaket som skickas över länken g1/0/3 mot internetleverantören."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 12: Interface tracking övervakar upplänken g1/0/3 och sänker HSRP-prioriteten vid länkbrott.",
    "ref": "Lab-konfiguration & PDF Sida 12: 'standby 10 track g1/0/3'"
  },
  {
    "id": 46,
    "category": "topology-cli",
    "importance": "★ FLOATING ROUTE",
    "question": "Varför slutar kommandot 'ip route 192.168.10.0 255.255.255.0 203.0.113.6 5' med siffran 5?",
    "options": [
      "Siffran 5 sätter administrativ distans (AD) till 5 och skapar en floating static backup.",
      "Siffran 5 anger hur många sekunder routern ska vänta innan paketet sänds över nätverket.",
      "Siffran 5 anger att rutten endast gäller för maximalt fem anslutna lokala klientdatorer.",
      "Siffran 5 kopplar rutten direkt till HSRP-grupp nummer fem i routerns interna minnestyp."
    ],
    "correctIndex": 0,
    "explanation": "Siffran 5 definierar en administrativ distans (AD) högre än standard (1), vilket skapar en floating static route.",
    "ref": "Lab-konfiguration: 'ip route 192.168.10.0 255.255.255.0 203.0.113.6 5'"
  },
  {
    "id": 47,
    "category": "topology-cli",
    "importance": "★ VERSION 2 KOMMANDO",
    "question": "Vilket kommando aktiverar HSRP version 2 under ett VLAN-gränssnitt i Cisco IOS?",
    "options": [
      "standby version 2 körs på interfacenivå för att aktivera HSRP version 2 i konfigurationen.",
      "hsrp version 2 körs på interfacenivå för att aktivera HSRP version 2 i konfigurationen.",
      "standby v2 enable körs på interfacenivå för att aktivera HSRP version 2 i konfigurationen.",
      "version hsrp 2 körs på interfacenivå för att aktivera HSRP version 2 i konfigurationen."
    ],
    "correctIndex": 0,
    "explanation": "Cisco IOS-syntax under gränssnittet är: 'standby version 2'.",
    "ref": "Lab-konfiguration: 'MLS1(config-if)#standby version 2'"
  },
  {
    "id": 48,
    "category": "topology-cli",
    "importance": "★ ACCESS PORT KONFIG",
    "question": "Hur konfigureras porten g1/0/2 på MLS1 som ansluter till access-switchen S1?",
    "options": [
      "switchport mode access följt av switchport access vlan 10 direkt under interfacet.",
      "switchport mode trunk följt av switchport trunk allowed vlan 10 direkt på switchport.",
      "no switchport följt av kommandot ip address 192.168.10.2 direkt under gränssnittet.",
      "standby 10 vlan access följt av ip default-gateway direkt under switchkonfiguration."
    ],
    "correctIndex": 0,
    "explanation": "Porten mot Layer 2-switchen S1 konfigureras med 'switchport mode access' och 'switchport access vlan 10'.",
    "ref": "Lab-konfiguration: 'MLS1(config-if)#switchport mode access'"
  },
  {
    "id": 49,
    "category": "topology-cli",
    "importance": "★ DEFAULT ROUTE",
    "question": "Vilket kommando konfigurerar en default route på MLS1 mot ISP:s port (203.0.113.1)?",
    "options": [
      "ip route 0.0.0.0 0.0.0.0 203.0.113.1 konfigurerar standardrutten i globalt läge.",
      "ip default-gateway 203.0.113.1 konfigurerar standardrutten i det globala läget.",
      "ip route default 203.0.113.1 konfigurerar standardrutten i detta globala läge.",
      "standby route 0.0.0.0 203.0.113.1 konfigurerar standardrutten i ett globalt läge."
    ],
    "correctIndex": 0,
    "explanation": "På en enhet med routing aktiverad är syntaxen: 'ip route 0.0.0.0 0.0.0.0 <next-hop>'.",
    "ref": "Lab-konfiguration: 'MLS1(config)#ip route 0.0.0.0 0.0.0.0 203.0.113.1'"
  },
  {
    "id": 50,
    "category": "topology-cli",
    "importance": "★ SPARA KONFIGURATION",
    "question": "Vilket kommando körs i privileged EXEC mode för att spara den aktiva konfigurationen?",
    "options": [
      "copy running-config startup-config (eller write memory) sparar ändringar i NVRAM.",
      "save config running (eller kommandot store config) sparar ändringar direkt i NVRAM.",
      "store startup-config (eller kommandot flash write) sparar ändringar direkt i NVRAM.",
      "nvram write running (eller kommandot sync config) sparar ändringar direkt i NVRAM."
    ],
    "correctIndex": 0,
    "explanation": "Kommandot är 'copy running-config startup-config' (eller 'write memory' / 'wr').",
    "ref": "Lab-konfiguration: 'ISP#copy running-config startup-config'"
  },
  {
    "id": 51,
    "category": "topology-cli",
    "importance": "★ PROVLABB GRUPP 150",
    "question": "Vilken kommandoföljd konfigurerar HSRP-grupp 150 på R1 enligt provanteckningarna?",
    "options": [
      "standby 150 ip 192.168.1.1 följt av standby 150 priority 110 och standby 150 preempt.",
      "hsrp 150 ip 192.168.1.1 följt av hsrp 150 priority 110 och hsrp 150 preempt på porten.",
      "vrrp 150 ip 192.168.1.1 följt av vrrp 150 priority 110 och vrrp 150 master på porten.",
      "standby ip 192.168.1.1 följt av standby priority 110 och standby mode active på porten."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 6: 'R1(config-if)# standby 150 ip 192.168.1.1, standby 150 priority 110, standby 150 preempt, no shutdown'.",
    "ref": "PDF Sida 6: 'Den virtuella mac-addressen - exempel / R1 konfiguration'"
  },
  {
    "id": 52,
    "category": "topology-cli",
    "importance": "★ SVI-ADRESS REGEL",
    "question": "Varför konfigureras klienten ALDRIG med MLS1:s eller MLS2:s fysiska SVI-adress?",
    "options": [
      "För att redundansen då förloras helt – går den switchen ner tappar datorn nätverket.",
      "För att en Cisco-switch enligt standardprotokoll förbjuder ping mot en SVI-adress.",
      "För att fysiska SVI-adresser inte har nätmaskor och kan inte routas över Layer 3-nät.",
      "För att fysiska SVI-adresser automatiskt byter IP-adress var femte minut under drift."
    ],
    "correctIndex": 0,
    "explanation": "PDF Sida 4 & Labbguide: Klienten konfigureras med VIP (192.168.10.1), aldrig med de fysiska SVI-adresserna (.2 eller .3), för att redundansen ska fungera vid haveri.",
    "ref": "PDF Sida 4: 'kilenterna konfigueras att använda denna VIP som sin default gateway'"
  }
];

// ==========================================
// 2B. DIGINTO QUESTION DATABASE
// ==========================================
const DIGINTO_QUESTIONS = [
  {
    "id": "dig-1",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vilken multicast-adress använder HSRP version 1 respektive HSRP version 2 för Hello-meddelanden enligt Diginto?",
    "options": [
      "HSRP version 1 använder 224.0.0.2 och HSRP version 2 använder 224.0.0.102 i nätet.",
      "HSRP version 1 använder 224.0.0.18 och HSRP version 2 använder 224.0.0.2 i nätet.",
      "HSRP version 1 använder 224.0.0.102 och HSRP version 2 använder 224.0.0.254 i nät.",
      "Båda versionerna skickar broadcast (255.255.255.255) istället för multicast i nät."
    ],
    "correctIndex": 0,
    "explanation": "Enligt Diginto (Mer om FHRP): HSRP version 1 använder multicast-adressen 224.0.0.2, medan HSRP version 2 använder 224.0.0.102.",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Hot Standby Router Protocol)"
  },
  {
    "id": "dig-2",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vilken multicast-adress används i VRRP för att skicka annonseringar från Master router?",
    "options": [
      "VRRP annonserar sina kontrollmeddelanden på den reserverade multicast-adressen 224.0.0.18",
      "VRRP annonserar sina kontrollmeddelanden på den reserverade multicast-adressen 224.0.0.20",
      "VRRP annonserar sina kontrollmeddelanden på den reserverade multicast-adressen 224.0.0.10",
      "VRRP annonserar sina kontrollmeddelanden på den reserverade multicast-adressen 224.0.0.90"
    ],
    "correctIndex": 0,
    "explanation": "VRRP använder den reserverade multicast-adressen 224.0.0.18 för kommunikation mellan Master och Backup-routrar.",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Virtual Router Redundancy Protocol)"
  },
  {
    "id": "dig-3",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vilken multicast-adress använder GLBP för att koordinera lastbalansering mellan routrarna?",
    "options": [
      "GLBP koordinerar sin lastbalansering över den reserverade multicast-adressen 224.0.0.102",
      "GLBP koordinerar sin lastbalansering över den reserverade multicast-adressen 224.0.0.200",
      "GLBP koordinerar sin lastbalansering över den reserverade multicast-adressen 224.0.0.180",
      "GLBP koordinerar sin lastbalansering över den reserverade multicast-adressen 224.0.0.254"
    ],
    "correctIndex": 0,
    "explanation": "GLBP använder multicast-adressen 224.0.0.102 för att koordinera lastbalansering och status mellan routrarna i gruppen (samma adress som HSRPv2!).",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Gateway Load Balancing Protocol)"
  },
  {
    "id": "dig-4",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP & HSRP",
    "question": "Vad är standardvärdena för Hello-timer och Hold-timer i HSRP enligt Diginto?",
    "options": [
      "Hello-timern är satt till 3 sekunder och Hold-timern är satt till 10 sekunder.",
      "Hello-timern är satt till 1 sekund och Hold-timern är satt till 3 sekunder här.",
      "Hello-timern är satt till 5 sekunder och Hold-timern är satt till 15 sekunder.",
      "Hello-timern är satt till 10 sekunder och Hold-timern är satt till 30 sekunder."
    ],
    "correctIndex": 0,
    "explanation": "Standardvärdet för HSRP Hello-timer är 3 sekunder, och Hold-timern (tiden standby väntar innan den tar över) är 10 sekunder.",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ & hsrp-oversikt/"
  },
  {
    "id": "dig-5",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vad är standardvärdena för Advertisement-intervall och failover i VRRP enligt Diginto?",
    "options": [
      "Advertisement-intervall är 1 sekund och failover sker inom 3 sekunder i nätet.",
      "Advertisement-intervall är 3 sekunder och failover sker inom 10 sekunder i nät.",
      "Advertisement-intervall är 5 sekunder och failover sker inom 15 sekunder i nät.",
      "Advertisement-intervall är 10 sekunder och failover sker inom 30 sekunder i nät."
    ],
    "correctIndex": 0,
    "explanation": "I VRRP skickar Master-routern uppdateringar var 1 sekund, och failover sker inom 3 sekunder om uppdateringar uteblir.",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: VRRP & Timers i FHRP)"
  },
  {
    "id": "dig-6",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vilken är den rekommenderade nedre gränsen för HSRP-timers enligt Diginto, och vad är risken om de sätts för lågt?",
    "options": [
      "Hello bör inte sättas under 1s och Hold inte under 4s på grund av risk för hög CPU-last och instabilitet.",
      "Hello bör inte sättas under 2s och Hold inte under 8s på grund av risk för överhettning i ASIC-kretsen.",
      "Hello bör inte sättas under 3s och Hold inte under 9s på grund av risk för paketloopar i nätverkshuben.",
      "Hello bör inte sättas under 5s och Hold inte under 15s på grund av risk för minnesläckor i operativet."
    ],
    "correctIndex": 0,
    "explanation": "Diginto betonar: 'Hello-timern bör inte sättas under 1 sekund och Hold-timern inte under 4 sekunder, eftersom detta kan leda till ökad CPU-belastning och instabilitet i standby-tillståndet.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP-status och timers)"
  },
  {
    "id": "dig-7",
    "category": "election-preempt",
    "sourceTag": "🌐 DIGINTO MER OM FHRP & HSRP",
    "question": "Om två eller fler routrar i en FHRP/HSRP-grupp har exakt samma prioritet, vad fungerar som 'tiebreaker'?",
    "options": [
      "Den högsta numeriska IPv4-adressen på det deltagande gränssnittet utses till vinnare och blir aktiv router.",
      "Den lägsta fysiska MAC-adressen på routerns moderkort utses till vinnare och blir aktiv router i LAN-nätet.",
      "Den router som har längst sammanhängande drifttid (uptime) utses till vinnare och blir aktiv router här.",
      "Den router som har snabbast fysiska portkanal (t.ex. 10G över 1G) utses till vinnare och blir aktiv router."
    ],
    "correctIndex": 0,
    "explanation": "Diginto anger tydligt: 'Om två eller fler routrar har samma prioritet används deras högsta IP-adress som avgörande faktor. Den router med högst IP-adress på det interface som deltar i FHRP-gruppen blir då aktiv.'",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Tiebreaker)"
  },
  {
    "id": "dig-8",
    "category": "election-preempt",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT (NYCKELREGEL)",
    "question": "Vad händer om en router startar med SAMMA prioritet som den aktiva routern men en HÖGRE IPv4-adress, och 'preempt' är aktiverat?",
    "options": [
      "Den nya routern tar INTE över rollen, eftersom preemption i HSRP enbart utvärderar prioritet och inte IP.",
      "Den nya routern tar OMEDELBART över rollen, eftersom en högre IP-adress alltid tvingar fram ett ledarbyte.",
      "Båda routrarna delar upp utgående trafik 50/50 genom att köra automatisk lastdelning via round-robin här.",
      "HSRP-processen kraschar på båda enheterna och stänger av portarna på grund av detekterad IP-konflikt i LAN."
    ],
    "correctIndex": 0,
    "explanation": "Mycket viktig detaljregel från Diginto: 'Preemption påverkar ENDAST prioritet, inte IP-adress. En router med samma prioritet men en högre IPv4-adress kommer INTE att ta över rollen som aktiv router.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP Preemption)"
  },
  {
    "id": "dig-9",
    "category": "election-preempt",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vilket intervall kan HSRP-prioritet justeras mellan i Cisco IOS, och vad är standardvärdet?",
    "options": [
      "Prioriteten justeras mellan 0 och 255 på gränssnittet, med standardvärdet satt till 100.",
      "Prioriteten justeras mellan 1 och 100 på gränssnittet, med standardvärdet satt till 500.",
      "Prioriteten justeras mellan 1 och 4096 på gränssnittet, med standardvärdet satt till 100.",
      "Prioriteten justeras mellan 0 och 65535 på gränssnittet, med standardvärdet satt till 320."
    ],
    "correctIndex": 0,
    "explanation": "Standardvärdet för HSRP-prioritet är 100, men det kan justeras mellan 0 och 255. Kommandot är: 'standby priority <värde>'.",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP-prioritet)"
  },
  {
    "id": "dig-10",
    "category": "election-preempt",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "I Digintos labbexempel: R1 har prioritet 150 och preemption aktiverat. R2 har standardprioritet 100. Ett strömavbrott drabbar R1 och R2 tar över som aktiv. Vad sker när strömmen återställs till R1?",
    "options": [
      "R1 återtar automatiskt rollen som aktiv router eftersom preemption är aktivt och R1 har högre prioritet (150 mot 100).",
      "R2 förblir aktiv permanent eftersom en aktiv router enligt HSRP-standarden aldrig någonsin lämnar ifrån sig ledarrollen.",
      "R1 placeras permanent i standby-läge och måste startas om manuellt med reload för att kunna återfå sin aktiva ledarroll.",
      "Båda routrarna stänger ner sina fysiska nätverksinterface på grund av en konflikt med dubbla aktiva noder i gruppen här."
    ],
    "correctIndex": 0,
    "explanation": "Diginto: 'När strömmen återställs och R1 kommer online igen, kommer en ny valprocess att utlösas eftersom R1 har högre prioritet och preemption är aktiverat. Detta gör att R1 återtar rollen som aktiv router, medan R2 återgår till standby-läge.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP Preemption labbexempel)"
  },
  {
    "id": "dig-11",
    "category": "election-preempt",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vad gäller om preemption är INAKTIVERAT på samtliga HSRP-routrar under valprocessen?",
    "options": [
      "Den router som startar först blir aktiv och behåller rollen så länge den fungerar, även om en senare nod har högre prio.",
      "Routern med högst prioritet tar ändå alltid över ledarrollen så fort den skickar sitt allra första hello-paket i nätet.",
      "Ingen av routrarna kan någonsin bli aktiv utan båda förblir låsta i Speak-tillståndet tills standby preempt konfigureras.",
      "Routrarna växlar ledarrollen mellan sig var femte minut för att förhindra att en enskild enhet överbelastas av trafiken."
    ],
    "correctIndex": 0,
    "explanation": "Diginto: 'Om preemption är inaktiverat kommer den router som startar först att bli aktiv om inga andra routrar är online vid valprocessen.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Obs-ruta)"
  },
  {
    "id": "dig-12",
    "category": "states-deep",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Hur definierar Diginto HSRP-tillståndet 'Initial'?",
    "options": [
      "Routern är i startläge och har ännu inte deltagit i gruppen; detta är första tillståndet efter aktivering.",
      "Routern skickar aktiva hellos för att utmana befintliga noder och kräva omedelbart ledarskap i nätverket.",
      "Routern har vunnit valprocessen och vidarebefordrar redan alla datapaket från de lokala klientdatorerna.",
      "Routern lyssnar uteslutande på inkommande ARP-förfrågningar utan att registrera några grannroutrar i RAM."
    ],
    "correctIndex": 0,
    "explanation": "Diginto tabell: 'Initial – Routern är i startläge och har ännu inte deltagit i HSRP-gruppen. Detta är det första tillståndet efter att interfacet har aktiverats eller routern startats om.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    "id": "dig-13",
    "category": "states-deep",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vad är den exakta funktionen för HSRP-tillståndet 'Learn' enligt Diginto?",
    "options": [
      "Routern väntar på ett hello-meddelande från en annan router för att lära sig gruppens virtuella IP-adress.",
      "Routern laddar ner routingtabeller via OSPF och EIGRP från den primära distributionsswitchen i nätverket.",
      "Routern analyserar klienternas MAC-adresser för att dynamiskt konfigurera accessportarnas VLAN-tilldelning.",
      "Routern utför ett hårdvarutest av alla anslutna switchportar för att verifiera länkhastighet och duplexläge."
    ],
    "correctIndex": 0,
    "explanation": "Diginto tabell: 'Learn – Routern väntar på att ta emot ett Hello-meddelande från en annan HSRP-router för att lära sig den virtuella IP-adressen. Om den inte får någon information under denna fas, går den över till Speak-tillståndet.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    "id": "dig-14",
    "category": "states-deep",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Hur beskrivs HSRP-tillståndet 'Listen' i Diginto?",
    "options": [
      "Routern lyssnar på hello-meddelanden men har ingen aktiv roll; den känner till virtuella IP:n och är passiv.",
      "Routern skickar ut kontinuerliga ARP-förfrågningar till alla anslutna klienter för att kartlägga nätverket.",
      "Routern agerar backup för standby-routern och vidarebefordrar exakt hälften av all inkommande datatrafik.",
      "Routern väntar på att administratören ska godkänna anslutningen manuellt genom kommandot no shutdown här."
    ],
    "correctIndex": 0,
    "explanation": "Diginto tabell: 'Listen – Routern lyssnar på Hello-meddelanden men har ingen aktiv roll. Den känner till den virtuella IP-adressen och är en passiv medlem i HSRP-gruppen.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    "id": "dig-15",
    "category": "states-deep",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vad gör routern i HSRP-tillståndet 'Speak'?",
    "options": [
      "Den skickar ut hello-meddelanden för att meddela sin närvaro och deltar aktivt i valprocessen för gruppen.",
      "Den skickar röstmeddelanden (VoIP) direkt till företagets telefonväxel för att prioritera talkommunikation.",
      "Den stänger ner grannroutrarnas fysiska portar genom att injicera felaktiga BPDU-ramar på Layer 2-switchen.",
      "Den vidarebefordrar datatrafik direkt till internetleverantören utan att konsultera den lokala routingen."
    ],
    "correctIndex": 0,
    "explanation": "Diginto tabell: 'Speak – Routern skickar ut Hello-meddelanden för att meddela sin närvaro och deltar i valprocessen för att bli aktiv eller standby-router.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Tabell: HSRP State)"
  },
  {
    "id": "dig-16",
    "category": "states-deep",
    "sourceTag": "🌐 DIGINTO HSRP ÖVERSIKT",
    "question": "Vilket specifikt krav gäller för att en router ska kunna nå statusen 'Active' eller 'Standby'?",
    "options": [
      "Den kan endast nå Active eller Standby om den har fått en virtuell IP-adress och genomgått valprocessen.",
      "Den måste ha minst en fysisk 10 Gbps fiberlänk ansluten till alla lokala distributionsswitchar i hallen.",
      "Den måste ha sin prioritet manuellt konfigurerad till ett värde över 200 via administratörens CLI-konsol.",
      "Den måste köra Cisco IOS version 17 eller senare med en särskild enterprise-licens installerad i minnet."
    ],
    "correctIndex": 0,
    "explanation": "Diginto Obs-ruta: 'En router kan endast vara i Active eller Standby-status om den har fått en virtuell IP-adress och genomgått valprocessen.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/ (Sektion: HSRP-status och timers)"
  },
  {
    "id": "dig-17",
    "category": "glbp-deep",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Hur skiljer sig GLBP:s trafikfördelning från traditionell dynamisk lastbalansering enligt Diginto?",
    "options": [
      "GLBP använder statisk fördelning enligt en vald algoritm och mäter inte belastningen dynamiskt i realtid.",
      "GLBP mäter bandbreddsutnyttjandet på varje enskild länk varje millisekund och flyttar sessioner i realtid.",
      "GLBP kan enbart användas i nätverk med manuellt tilldelade statiska IP-adresser utan DHCP-funktionalitet.",
      "GLBP fördelar uteslutande UDP-trafik över nätverket medan alla TCP-sessioner blockeras av brandväggen här."
    ],
    "correctIndex": 0,
    "explanation": "Diginto förklarar: 'GLBP använder dock statisk fördelning, vilket innebär att det inte aktivt övervakar trafikbelastningen och dynamiskt justerar trafiken mellan routrarna. Istället sker fördelningen enligt en vald algoritm.'",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Gateway Load Balancing Protocol)"
  },
  {
    "id": "dig-18",
    "category": "glbp-deep",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vad innebär metoden 'Per-MAC' vid lastbalansering i GLBP enligt Diginto?",
    "options": [
      "Varje router får en unik virtuell MAC kopplad till gatewayen och klienter fördelas mellan dessa adresser.",
      "Routern byter MAC-adress på sin egen fysiska switchport var tredje sekund för att förvilla angripare här.",
      "Klienternas hårdvaruadresser binds permanent i routerns startup-config för att förhindra obehöriga byten.",
      "Endast klienter med certifierade MAC-adresser tillåts skicka datatrafik ut på leverantörens externa nät."
    ],
    "correctIndex": 0,
    "explanation": "Diginto: 'Per-MAC: Varje router får en unik MAC-adress kopplad till den virtuella gatewayen. Klienter fördelas mellan dessa MAC-adresser för att sprida trafiken.'",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Hur fungerar GLBP?)"
  },
  {
    "id": "dig-19",
    "category": "glbp-deep",
    "sourceTag": "🌐 DIGINTO MER OM FHRP",
    "question": "Vad innebär metoden 'Per-destination' vid lastbalansering i GLBP enligt Diginto?",
    "options": [
      "Trafiken delas upp baserat på destinations-IP så att varje router ansvarar för trafik till specifika mål.",
      "All användartrafik måste alltid dirigeras till en och samma centrala proxyserver för inspektion i molnet.",
      "Klienten väljer själv vilken destinationsrouter den vill skicka paket till genom automatiska traceroutes.",
      "Routrarna dirigerar alltid inkommande paket i alfabetisk ordning baserat på domännamnet i webbadressen."
    ],
    "correctIndex": 0,
    "explanation": "Diginto: 'Per-destination: Trafiken delas upp baserat på destinationens IP-adress. Varje router i GLBP-gruppen ansvarar för att vidarebefordra trafik till vissa destinationer, istället för att slumpmässigt fördela trafiken per klient.'",
    "ref": "diginto.se/fhrp-koncepten/mer-om-fhrp/ (Sektion: Hur fungerar GLBP?)"
  },
  {
    "id": "dig-20",
    "category": "multicast-timers",
    "sourceTag": "🌐 DIGINTO MER OM FHRP & HSRP",
    "question": "Vilka två protokollversioner erbjuder Cisco för HSRP enligt Diginto för transparent failover?",
    "options": [
      "Cisco erbjuder HSRP för IPv4 samt HSRP för IPv6 för att säkerställa kontinuerlig tillgänglighet.",
      "Cisco erbjuder HSRP Standard samt HSRP Turbo för att säkerställa högsta nätverkstillgänglighet.",
      "Cisco erbjuder HSRP Classic samt HSRP Enterprise för att säkerställa kontinuerlig tillgänglighet.",
      "Cisco erbjuder endast HSRP version 1 officiellt för att säkerställa kontinuerlig tillgänglighet."
    ],
    "correctIndex": 0,
    "explanation": "Diginto (HSRP översikt): 'Cisco erbjuder HSRP och HSRP för IPv6 för att säkerställa nätverksanslutning även om default gateway misslyckas.'",
    "ref": "diginto.se/fhrp-koncepten/hsrp-oversikt/"
  }
];

// Fisher-Yates Shuffle Utility
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ==========================================
// 3. CLI COMMANDS DATABASE (Interactive Trainer)
// ==========================================
// 3. CLI COMMANDS DATABASE (Pure HSRP Trainer)
// ==========================================
const COMMANDS_DB = [
  // 1. HSRP Version & Grund
  {
    id: "cmd-hsrp-v2",
    cat: "hsrp-basic",
    targetDevice: "MLS1(config-if)#",
    title: "Aktivera HSRP Version 2",
    desc: "På interface vlan 10 måste version 2 aktiveras för att stödja MAC-adresser i intervallet <code class=\"code-inline\">0000.0c9f.f000</code> till <code class=\"code-inline\">0000.0c9f.ffff</code>, IPv6 och gruppnummer upp till 4095.",
    hint: "standby version 2",
    canonical: "standby version 2",
    validRegex: /^standby\s+version\s+2$/i,
    explanation: "Aktiverar HSRP version 2 på det aktuella interfacet."
  },
  {
    id: "cmd-hsrp-v1",
    cat: "hsrp-basic",
    targetDevice: "MLS1(config-if)#",
    title: "Sätt HSRP Version 1 (Standard)",
    desc: "Konfigurera eller återställ interfacet till HSRP version 1 (standardversion begränsad till grupp 0–255 och MAC 0000.0c07.acxx).",
    hint: "standby version 1",
    canonical: "standby version 1",
    validRegex: /^standby\s+version\s+1$/i,
    explanation: "Sätter interfacet i HSRP version 1-läge."
  },
  {
    id: "cmd-hsrp-ip",
    cat: "hsrp-basic",
    targetDevice: "MLS1(config-if)#",
    title: "Konfigurera virtuell IP-adress",
    desc: "Skapa HSRP-grupp 10 och tilldela den virtuella IP-adressen <code class=\"code-inline\">192.168.10.1</code> som PC0 och klienterna använder som sin Default Gateway.",
    hint: "standby [grupp] ip [ip-adress]",
    canonical: "standby 10 ip 192.168.10.1",
    validRegex: /^standby\s+10\s+ip\s+192\.168\.10\.1$/i,
    explanation: "Skapar HSRP-grupp 10 och sätter den virtuella gateway-adressen till 192.168.10.1."
  },
  {
    id: "cmd-hsrp-name",
    cat: "hsrp-basic",
    targetDevice: "MLS1(config-if)#",
    title: "Namnge HSRP-gruppen (Beskrivande namn)",
    desc: "Tilldela HSRP-grupp 10 det logiska beskrivande namnet <code class=\"code-inline\">HSRP_VLAN10</code>.",
    hint: "standby [grupp] name [namn]",
    canonical: "standby 10 name HSRP_VLAN10",
    validRegex: /^standby\s+10\s+name\s+HSRP_VLAN10$/i,
    explanation: "Ger HSRP-gruppen ett unikt textnamn för enkel identifiering i konfigurationen."
  },
  // 2. Prioritet & Preemption
  {
    id: "cmd-hsrp-prio",
    cat: "prio-preempt",
    targetDevice: "MLS1(config-if)#",
    title: "Sätt HSRP Prioritet till 105",
    desc: "Sätt prioriteten för grupp 10 till 105 så att MLS1 vinner valet och blir primär router (Active) istället för standardvärdet 100.",
    hint: "standby [grupp] priority [värde]",
    canonical: "standby 10 priority 105",
    validRegex: /^(standby\s+10\s+priority\s+105|standby\s+10\s+prio\s+105)$/i,
    explanation: "Sätter prioritet 105 (standard är 100). Högst prioritet blir Active router."
  },
  {
    id: "cmd-hsrp-preempt",
    cat: "prio-preempt",
    targetDevice: "MLS1(config-if)#",
    title: "Aktivera Preemption (standby preempt)",
    desc: "Tillåt routern att ta tillbaka rollen som Active router om den startar om eller återansluts och har högre prioritet än nuvarande aktiv router.",
    hint: "standby [grupp] preempt",
    canonical: "standby 10 preempt",
    validRegex: /^standby\s+10\s+preempt$/i,
    explanation: "Preemption gör att routern jämför prioritet och omedelbart tar över som Active om dess prioritet är högre."
  },
  {
    id: "cmd-hsrp-preempt-delay",
    cat: "prio-preempt",
    targetDevice: "MLS1(config-if)#",
    title: "Konfigurera Preempt Delay (30 sekunder)",
    desc: "Fördröj preemption med minst 30 sekunder efter boot så att routingprotokoll (som OSPF/EIGRP) hinner konvergera innan routern tar över klienttrafiken.",
    hint: "standby [grupp] preempt delay minimum [sekunder]",
    canonical: "standby 10 preempt delay minimum 30",
    validRegex: /^(standby\s+10\s+preempt\s+delay\s+minimum\s+30|standby\s+10\s+preempt\s+delay\s+min\s+30)$/i,
    explanation: "Fördröjer övertagandet med 30 sekunder för att undvika svart hål-trafik under routingkonvergens."
  },
  // 3. Tracking & Timers
  {
    id: "cmd-hsrp-track",
    cat: "track-timers",
    targetDevice: "MLS1(config-if)#",
    title: "Interface Tracking (Övervaka upplänk mot ISP)",
    desc: "Övervaka upplänken g1/0/3 för grupp 10 så att prioriteten sänks automatiskt om länken mot ISP dör.",
    hint: "standby [grupp] track [interface]",
    canonical: "standby 10 track g1/0/3",
    validRegex: /^(standby\s+10\s+track\s+(g1\/0\/3|gigabitethernet\s*1\/0\/3))(\s+10)?$/i,
    explanation: "Interface tracking sänker HSRP-prioriteten vid länkavbrott så att standby-routern tar över."
  },
  {
    id: "cmd-hsrp-track-dec",
    cat: "track-timers",
    targetDevice: "MLS1(config-if)#",
    title: "Interface Tracking med specifik minskning (20)",
    desc: "Konfigurera interface tracking för grupp 10 mot g1/0/3 med ett explicit avdrag på 20 vid avbrott.",
    hint: "standby 10 track g1/0/3 20",
    canonical: "standby 10 track g1/0/3 20",
    validRegex: /^(standby\s+10\s+track\s+(g1\/0\/3|gigabitethernet\s*1\/0\/3)\s+20)$/i,
    explanation: "Minskar routerns prioritet med exakt 20 om det övervakade interfacet går ner."
  },
  {
    id: "cmd-hsrp-timers-sec",
    cat: "track-timers",
    targetDevice: "MLS1(config-if)#",
    title: "Justera HSRP Timers (Sekunder: Hello 1s, Hold 4s)",
    desc: "Sätt HSRP Hello-timer till 1 sekund och Hold-timer till 4 sekunder för snabbare felväxling (enligt Digintos rekommendation).",
    hint: "standby [grupp] timers [hello] [hold]",
    canonical: "standby 10 timers 1 4",
    validRegex: /^standby\s+10\s+timers\s+1\s+4$/i,
    explanation: "Sätter Hello-timer till 1s och Hold-timer till 4s."
  },
  {
    id: "cmd-hsrp-timers-msec",
    cat: "track-timers",
    targetDevice: "MLS1(config-if)#",
    title: "Sub-sekunds Timers (Millisekunder)",
    desc: "Konfigurera millisekund-timers: Hello var 200:e millisekund och Hold-timer till 750 millisekunder.",
    hint: "standby [grupp] timers msec [hello] msec [hold]",
    canonical: "standby 10 timers msec 200 msec 750",
    validRegex: /^standby\s+10\s+timers\s+msec\s+200\s+msec\s+750$/i,
    explanation: "Aktiverar sub-sekundsnivå för Hello och Hold för minimal failover-tid."
  },
  // 4. Autentisering & Säkerhet
  {
    id: "cmd-hsrp-auth-text",
    cat: "auth",
    targetDevice: "MLS1(config-if)#",
    title: "Klartext Autentisering (Plain text)",
    desc: "Säkra HSRP-grupp 10 med klartextlösenordet <code class=\"code-inline\">cisco</code> så att obehöriga enheter inte kan injicera Hello-paket.",
    hint: "standby [grupp] authentication [lösenord]",
    canonical: "standby 10 authentication cisco",
    validRegex: /^standby\s+10\s+authentication\s+cisco$/i,
    explanation: "Sätter klartextautentisering för HSRP-gruppen."
  },
  {
    id: "cmd-hsrp-auth-md5",
    cat: "auth",
    targetDevice: "MLS1(config-if)#",
    title: "MD5 Key-string Autentisering (Kryptografisk)",
    desc: "Aktivera säker kryptografisk MD5-autentisering för grupp 10 med nyckelsträngen <code class=\"code-inline\">CiscoPass1</code>.",
    hint: "standby [grupp] authentication md5 key-string [nyckel]",
    canonical: "standby 10 authentication md5 key-string CiscoPass1",
    validRegex: /^(standby\s+10\s+authentication\s+md5\s+key-string\s+CiscoPass1|standby\s+10\s+auth\s+md5\s+key-string\s+CiscoPass1)$/i,
    explanation: "Skyddar HSRP-meddelanden mot avlyssning och falska Hello-paket med MD5."
  },
  // 5. Show & Debug (Verifiering)
  {
    id: "cmd-show-standby-brief",
    cat: "show",
    targetDevice: "MLS1#",
    title: "show standby brief (Viktigaste provkommandot)",
    desc: "Visa en snabb sammanfattningstabell över alla HSRP-grupper med kolumnerna Interface, Grp, Pri, P (Preempt), State, Active, Standby och Virtual IP.",
    hint: "show standby brief",
    canonical: "show standby brief",
    validRegex: /^(show\s+standby\s+brief|sh\s+standby\s+brief|sh\s+stand\s+br)$/i,
    explanation: "Ciscos standardkommando för att omedelbart verifiera HSRP-tillstånd på alla grupper."
  },
  {
    id: "cmd-show-standby",
    cat: "show",
    targetDevice: "MLS1#",
    title: "show standby (Fullständig detaljerad status)",
    desc: "Visa detaljerad HSRP-information inklusive virtuell MAC-adress, exakta timers, aktiva och standby-routrars IP, och trackingstatus.",
    hint: "show standby",
    canonical: "show standby",
    validRegex: /^(show\s+standby|sh\s+standby)$/i,
    explanation: "Visar fullständig detaljvy över HSRP-konfiguration och aktuell driftstatus."
  },
  {
    id: "cmd-show-standby-vlan",
    cat: "show",
    targetDevice: "MLS1#",
    title: "show standby vlan 10 (Specifikt interface)",
    desc: "Filtrera och visa HSRP-information specifikt för interface VLAN 10.",
    hint: "show standby vlan 10",
    canonical: "show standby vlan 10",
    validRegex: /^(show\s+standby\s+vlan\s+10|sh\s+standby\s+vlan\s+10)$/i,
    explanation: "Visar HSRP-status specifikt för interface vlan 10."
  },
  {
    id: "cmd-debug-standby",
    cat: "show",
    targetDevice: "MLS1#",
    title: "debug standby events (Felsök HSRP-tillstånd)",
    desc: "Felsök HSRP i realtid på konsolen genom att övervaka tillståndsbyten (Speak, Standby, Active) och valprocessen.",
    hint: "debug standby events",
    canonical: "debug standby events",
    validRegex: /^(debug\s+standby\s+events|deb\s+standby\s+events)$/i,
    explanation: "Loggar HSRP-händelser och tillståndsförändringar i realtid."
  },
  // 6. Prov-labb (Grupp 150 & ARP från nya anteckningarna)
  {
    id: "cmd-hsrp-150-ip",
    cat: "prov-labb",
    targetDevice: "R1(config-if)#",
    title: "Konfigurera Grupp 150 Virtuell IP (Provfråga)",
    desc: "På interface g0/1, konfigurera HSRP-grupp 150 med den virtuella IP-adressen <code class=\"code-inline\">192.168.1.1</code> enligt provanteckningarna.",
    hint: "standby 150 ip 192.168.1.1",
    canonical: "standby 150 ip 192.168.1.1",
    validRegex: /^standby\s+150\s+ip\s+192\.168\.1\.1$/i,
    explanation: "Skapar HSRP-grupp 150 och sätter den virtuella gateway-adressen till 192.168.1.1."
  },
  {
    id: "cmd-hsrp-150-prio",
    cat: "prov-labb",
    targetDevice: "R1(config-if)#",
    title: "Sätt Grupp 150 Prioritet till 110",
    desc: "Sätt HSRP-prioriteten för grupp 150 till 110 så att R1 vinner valet och blir Active framför R2 (som har standard 100).",
    hint: "standby 150 priority 110",
    canonical: "standby 150 priority 110",
    validRegex: /^(standby\s+150\s+priority\s+110|standby\s+150\s+prio\s+110)$/i,
    explanation: "Sätter prioritet 110 på grupp 150. Högsta prioritet vinner valet till Active."
  },
  {
    id: "cmd-hsrp-150-preempt",
    cat: "prov-labb",
    targetDevice: "R1(config-if)#",
    title: "Aktivera Preemption för Grupp 150",
    desc: "Aktivera preemption för HSRP-grupp 150 så att R1 kan återta ledarrollen som Active om den startar om efter ett fel.",
    hint: "standby 150 preempt",
    canonical: "standby 150 preempt",
    validRegex: /^standby\s+150\s+preempt$/i,
    explanation: "Gör att R1 med högre prioritet kan preemptera och återta rollen som Active vid omstart."
  },
  {
    id: "cmd-hsrp-150-timers",
    cat: "prov-labb",
    targetDevice: "R1(config-if)#",
    title: "Snabba Timers för Grupp 150 (Hello 1s, Hold 3s)",
    desc: "Konfigurera snabba timers för grupp 150 med Hello 1 sekund och Hold 3 sekunder enligt 3x-regeln från provet.",
    hint: "standby 150 timers 1 3",
    canonical: "standby 150 timers 1 3",
    validRegex: /^standby\s+150\s+timers\s+1\s+3$/i,
    explanation: "Sätter Hello-timer till 1s och Hold-timer till 3s (minst 3x Hello för att undvika onödiga rollbyten)."
  },
  {
    id: "cmd-hsrp-150-track",
    cat: "prov-labb",
    targetDevice: "R1(config-if)#",
    title: "Interface Tracking för Uplink (Skydd mot Black Holes)",
    desc: "Konfigurera interface tracking för grupp 150 mot upplänken g0/0 med ett prioritetavdrag på 20 vid avbrott.",
    hint: "standby 150 track g0/0 20",
    canonical: "standby 150 track g0/0 20",
    validRegex: /^(standby\s+150\s+track\s+(g0\/0|gigabitethernet\s*0\/0)\s+20)$/i,
    explanation: "Sänker prioriteten med 20 om upplänken går ner så reservroutern kan ta över och undvika trafikblindgång."
  },
  {
    id: "cmd-hsrp-arp-a",
    cat: "prov-labb",
    targetDevice: "C:\\Users\\gonriv>",
    title: "Verifiera Virtuell MAC-adress i Windows (arp -a)",
    desc: "Kör kommandot i Windows för att granska ARP-tabellen och verifiera att gatewayens IP <code class=\"code-inline\">10.1.1.1</code> är bunden till dess virtuella MAC-adress.",
    hint: "arp -a",
    canonical: "arp -a",
    validRegex: /^(arp\s+-a|arp\s+\/a)$/i,
    explanation: "Visar Windows ARP-tabell där default gateway 10.1.1.1 har MAC 00-00-0c-07-ac-01 (dynamic)."
  }
];

// ==========================================
// 4. FULL CONFIGURATIONS DATABASE (Tab 3)
// ==========================================
const CONFIG_MODELS = {
  mls1: {
    id: "mls1",
    name: "MLS1 (Multilayer Switch 1)",
    role: "HSRP Active • Prio 105 • Preempt • Track",
    contextTitle: "MLS1 Konfiguration & Nätverksroll",
    note: "MLS1 agerar Active router för VLAN 10 med prioritet 105. Har 'standby 10 track g1/0/3' som sänker prioriteten med 10 om ISP-länken går ner.",
    params: [
      { key: "Roll i HSRP", val: "Active (Primär Gateway)" },
      { key: "VLAN 10 Fysisk SVI", val: "192.168.10.2 /24" },
      { key: "Virtuell Gateway IP", val: "192.168.10.1 (Grupp 10)" },
      { key: "HSRP Version & Prio", val: "Version 2, Prioritet 105" },
      { key: "Preemption & Track", val: "Preempt PÅ, Track g1/0/3" },
      { key: "Länk mot ISP (g1/0/3)", val: "203.0.113.2 /30 (no switchport)" },
      { key: "Port mot S1 (g1/0/2)", val: "Access VLAN 10" },
      { key: "Default Route", val: "0.0.0.0 0.0.0.0 203.0.113.1" }
    ],
    fullSolution: 
`MLS1>en
MLS1#conf t
MLS1(config)#ip routing
MLS1(config)#interface g1/0/2
MLS1(config-if)#description ACCESS_TO_S1_G0/1
MLS1(config-if)#switchport mode access
MLS1(config-if)#switchport access vlan 10
MLS1(config-if)#no shutdown
MLS1(config-if)#exit
MLS1(config)#interface vlan 10
MLS1(config-if)#ip address 192.168.10.2 255.255.255.0
MLS1(config-if)#standby version 2
MLS1(config-if)#standby 10 ip 192.168.10.1
MLS1(config-if)#standby 10 priority 105
MLS1(config-if)#standby 10 preempt
MLS1(config-if)#standby 10 track g1/0/3
MLS1(config-if)#no shutdown
MLS1(config-if)#exit
MLS1(config)#interface g1/0/3
MLS1(config-if)#no switchport
MLS1(config-if)#ip address 203.0.113.2 255.255.255.252
MLS1(config-if)#no shutdown
MLS1(config-if)#exit
MLS1(config)#ip route 0.0.0.0 0.0.0.0 203.0.113.1`,
    guidedItems: [
      { prefix: "MLS1(config)#", target: "ip routing", label: "Aktivera routing globalt" },
      { prefix: "MLS1(config-if)#", target: "switchport mode access", label: "Sätt g1/0/2 i access-läge" },
      { prefix: "MLS1(config-if)#", target: "switchport access vlan 10", label: "Tilldela porten till VLAN 10" },
      { prefix: "MLS1(config-if)#", target: "ip address 192.168.10.2 255.255.255.0", label: "SVI IP på interface vlan 10" },
      { prefix: "MLS1(config-if)#", target: "standby version 2", label: "HSRP version 2" },
      { prefix: "MLS1(config-if)#", target: "standby 10 ip 192.168.10.1", label: "HSRP virtuell IP-adress" },
      { prefix: "MLS1(config-if)#", target: "standby 10 priority 105", label: "Sätt prioritet 105" },
      { prefix: "MLS1(config-if)#", target: "standby 10 preempt", label: "Aktivera preemption" },
      { prefix: "MLS1(config-if)#", target: "standby 10 track g1/0/3", label: "Övervaka upplänk g1/0/3" },
      { prefix: "MLS1(config-if)#", target: "no switchport", label: "Routad port på g1/0/3" },
      { prefix: "MLS1(config-if)#", target: "ip address 203.0.113.2 255.255.255.252", label: "IP mot ISP på g1/0/3" },
      { prefix: "MLS1(config)#", target: "ip route 0.0.0.0 0.0.0.0 203.0.113.1", label: "Default route mot ISP" }
    ]
  },

  mls2: {
    id: "mls2",
    name: "MLS2 (Multilayer Switch 2)",
    role: "HSRP Standby • Prio 100 • Preempt",
    contextTitle: "MLS2 Konfiguration & Nätverksroll",
    note: "MLS2 agerar Standby router med standardprioritet 100. Har även 'standby 10 preempt' och tar över om MLS1:s prioritet sjunker under 100 eller om MLS1 kraschar.",
    params: [
      { key: "Roll i HSRP", val: "Standby (Reserv Gateway)" },
      { key: "VLAN 10 Fysisk SVI", val: "192.168.10.3 /24" },
      { key: "Virtuell Gateway IP", val: "192.168.10.1 (Grupp 10)" },
      { key: "HSRP Version & Prio", val: "Version 2, Prioritet 100 (Default)" },
      { key: "Preemption", val: "standby 10 preempt" },
      { key: "Länk mot ISP (g1/0/4)", val: "203.0.113.6 /30 (no switchport)" },
      { key: "Port mot S1 (g1/0/2)", val: "Access VLAN 10" },
      { key: "Default Route", val: "0.0.0.0 0.0.0.0 203.0.113.5" }
    ],
    fullSolution:
`MLS2>en
MLS2#conf t
MLS2(config)#ip routing
MLS2(config)#interface g1/0/2
MLS2(config-if)#description ACCESS_TO_S1_G0/2
MLS2(config-if)#switchport mode access
MLS2(config-if)#switchport access vlan 10
MLS2(config-if)#no shutdown
MLS2(config-if)#exit
MLS2(config)#interface vlan 10
MLS2(config-if)#ip address 192.168.10.3 255.255.255.0
MLS2(config-if)#standby version 2
MLS2(config-if)#standby 10 ip 192.168.10.1
MLS2(config-if)#standby 10 priority 100
MLS2(config-if)#standby 10 preempt
MLS2(config-if)#no shutdown
MLS2(config-if)#exit
MLS2(config)#interface g1/0/4
MLS2(config-if)#no switchport
MLS2(config-if)#ip address 203.0.113.6 255.255.255.252
MLS2(config-if)#no shutdown
MLS2(config-if)#exit
MLS2(config)#ip route 0.0.0.0 0.0.0.0 203.0.113.5`,
    guidedItems: [
      { prefix: "MLS2(config)#", target: "ip routing", label: "Aktivera routing globalt" },
      { prefix: "MLS2(config-if)#", target: "switchport mode access", label: "Sätt g1/0/2 i access-läge" },
      { prefix: "MLS2(config-if)#", target: "switchport access vlan 10", label: "Tilldela porten till VLAN 10" },
      { prefix: "MLS2(config-if)#", target: "ip address 192.168.10.3 255.255.255.0", label: "SVI IP på interface vlan 10" },
      { prefix: "MLS2(config-if)#", target: "standby version 2", label: "HSRP version 2" },
      { prefix: "MLS2(config-if)#", target: "standby 10 ip 192.168.10.1", label: "Virtuell IP 192.168.10.1" },
      { prefix: "MLS2(config-if)#", target: "standby 10 priority 100", label: "Prioritet 100" },
      { prefix: "MLS2(config-if)#", target: "standby 10 preempt", label: "Aktivera preemption" },
      { prefix: "MLS2(config-if)#", target: "no switchport", label: "Routad port på g1/0/4" },
      { prefix: "MLS2(config-if)#", target: "ip address 203.0.113.6 255.255.255.252", label: "IP mot ISP på g1/0/4" },
      { prefix: "MLS2(config)#", target: "ip route 0.0.0.0 0.0.0.0 203.0.113.5", label: "Default route mot ISP" }
    ]
  },

  isp: {
    id: "isp",
    name: "ISP (Internet Service Provider Switch)",
    role: "L3 Internet Gateway • Floating Static Route",
    contextTitle: "ISP Konfiguration & Nätverksroll",
    note: "ISP har statisk rutt till VLAN 10 (192.168.10.0/24) via MLS1 (203.0.113.2) och en flytande statisk rutt (floating static route) med distans 5 via MLS2 (203.0.113.6).",
    params: [
      { key: "Hostname", val: "ISP" },
      { key: "Routing Status", val: "ip routing aktiverat" },
      { key: "Länk mot MLS1 (g1/0/3)", val: "203.0.113.1 /30" },
      { key: "Länk mot MLS2 (g1/0/4)", val: "203.0.113.5 /30" },
      { key: "Servernätverk (g1/0/24)", val: "SERVER_NETWORK (8.8.8.8/28)" },
      { key: "Primär statisk rutt", val: "192.168.10.0/24 via 203.0.113.2 (AD 1)" },
      { key: "Floating backup rutt", val: "192.168.10.0/24 via 203.0.113.6 AD 5" }
    ],
    fullSolution:
`Switch>enable
Switch#configure terminal
Switch(config)#hostname ISP
ISP(config)#ip routing
ISP(config)#interface g1/0/3
ISP(config-if)#description ROUTED_LINK_TO_MLS1
ISP(config-if)#no switchport
ISP(config-if)#ip address 203.0.113.1 255.255.255.252
ISP(config-if)#no shutdown
ISP(config-if)#exit
ISP(config)#interface g1/0/24
ISP(config-if)#description SERVER_NETWORK
ISP(config-if)#no shutdown
ISP(config-if)#exit
ISP(config)#ip route 192.168.10.0 255.255.255.0 203.0.113.2
ISP(config)#ip route 192.168.10.0 255.255.255.0 203.0.113.6 5
ISP(config)#end
ISP#copy running-config startup-config`,
    guidedItems: [
      { prefix: "Switch(config)#", target: "hostname ISP", label: "Byt hostname till ISP" },
      { prefix: "ISP(config)#", target: "ip routing", label: "Aktivera ip routing" },
      { prefix: "ISP(config-if)#", target: "no switchport", label: "no switchport på g1/0/3" },
      { prefix: "ISP(config-if)#", target: "ip address 203.0.113.1 255.255.255.252", label: "IP mot MLS1 på g1/0/3" },
      { prefix: "ISP(config)#", target: "ip route 192.168.10.0 255.255.255.0 203.0.113.2", label: "Primär statisk rutt via MLS1" },
      { prefix: "ISP(config)#", target: "ip route 192.168.10.0 255.255.255.0 203.0.113.6 5", label: "Floating static route via MLS2 med AD 5" },
      { prefix: "ISP#", target: "copy running-config startup-config", label: "Spara konfigurationen" }
    ]
  }
};

// ==========================================
// 5. APPLICATION STATE
// ==========================================
const state = {
  // Quiz (PDF questions)
  quiz: {
    category: "all",
    shuffledQuestions: [],
    currentIndex: 0,
    scoreCorrect: 0,
    scoreWrong: 0,
    streak: 0,
    answered: false
  },
  // Diginto Quiz
  diginto: {
    category: "all",
    shuffledQuestions: [],
    currentIndex: 0,
    scoreCorrect: 0,
    scoreWrong: 0,
    streak: 0,
    answered: false
  },
  // Commands
  commands: {
    category: "all",
    filteredList: [],
    currentIndex: 0,
    mode: "typing" // 'typing' or 'cards'
  },
  // Configs
  config: {
    currentDevice: "mls1",
    mode: "write" // 'write', 'guided', 'solution'
  },
  // Global continuous streak
  streak: 0
};

// ==========================================
// 6. INITIALIZATION & TAB SWITCHING
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initSoundToggle();
  initQuiz();
  initDigintoQuiz();
  initCommands();
  initConfigWorkspace();
  initTopologies();
});

function initTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      sfx.playClick();
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const targetPaneId = tab.getAttribute("data-tab");
      document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
      });
      const targetPane = document.getElementById(targetPaneId);
      if (targetPane) targetPane.classList.add("active");
    });
  });
}

function initSoundToggle() {
  const btn = document.getElementById("soundToggleBtn");
  const icon = document.getElementById("soundIcon");
  const label = btn.querySelector(".btn-label");

  btn.addEventListener("click", () => {
    sfx.enabled = !sfx.enabled;
    if (sfx.enabled) {
      icon.textContent = "🔊";
      label.textContent = "Ljud På";
      sfx.playTone(600, 'sine', 0.1);
    } else {
      icon.textContent = "🔇";
      label.textContent = "Ljud Av";
    }
  });
}

// ==========================================
// 7. QUIZ IMPLEMENTATION
// ==========================================
function initQuiz() {
  const restartBtn = document.getElementById("restartQuizBtn");
  const restartFinishedBtn = document.getElementById("restartFinishedQuizBtn");
  const categoryFilter = document.getElementById("quizCategoryFilter");
  const nextBtn = document.getElementById("nextQuestionBtn");
  const skipBtn = document.getElementById("skipQuestionBtn");

  restartBtn.addEventListener("click", () => {
    sfx.playClick();
    startNewQuizSession();
  });

  restartFinishedBtn.addEventListener("click", () => {
    sfx.playClick();
    startNewQuizSession();
  });

  categoryFilter.addEventListener("change", (e) => {
    state.quiz.category = e.target.value;
    startNewQuizSession();
  });

  nextBtn.addEventListener("click", () => {
    sfx.playClick();
    advanceQuizQuestion();
  });

  skipBtn.addEventListener("click", () => {
    advanceQuizQuestion();
  });

  startNewQuizSession();
}

function startNewQuizSession() {
  // Filter questions
  let pool = MASTER_QUESTIONS;
  if (state.quiz.category !== "all") {
    pool = pool.filter(q => q.category === state.quiz.category);
  }

  // Shuffle questions randomly
  state.quiz.shuffledQuestions = shuffleArray(pool).map(q => {
    // For each question, shuffle options and track the correct answer text
    const correctText = q.options[q.correctIndex];
    const shuffledOpts = shuffleArray(q.options);
    const newCorrectIdx = shuffledOpts.indexOf(correctText);
    return {
      ...q,
      options: shuffledOpts,
      correctIndex: newCorrectIdx
    };
  });

  state.quiz.currentIndex = 0;
  state.quiz.scoreCorrect = 0;
  state.quiz.scoreWrong = 0;
  state.quiz.streak = 0;
  state.quiz.answered = false;

  updateGlobalScore();

  document.getElementById("quizCard").style.display = "block";
  document.getElementById("quizFinishedCard").style.display = "none";

  renderCurrentQuizQuestion();
}

function renderCurrentQuizQuestion() {
  const currentQ = state.quiz.shuffledQuestions[state.quiz.currentIndex];
  if (!currentQ) {
    showQuizFinished();
    return;
  }

  state.quiz.answered = false;

  // Update Progress Bar
  const total = state.quiz.shuffledQuestions.length;
  const currentNum = state.quiz.currentIndex + 1;
  const percent = (currentNum / total) * 100;

  document.getElementById("quizStepText").textContent = `Fråga ${currentNum} av ${total}`;
  document.getElementById("quizCatBadge").textContent = getCategoryName(currentQ.category);
  document.getElementById("quizScoreDisplay").textContent = `Rätt: ${state.quiz.scoreCorrect} | Fel: ${state.quiz.scoreWrong}`;
  document.getElementById("quizProgressBar").style.width = `${percent}%`;

  // Question Card Elements
  document.getElementById("qNumberPill").textContent = `#${currentNum}`;
  document.getElementById("qImportanceTag").textContent = currentQ.importance || "★ KOMMER PÅ PROV";
  document.getElementById("quizQuestionText").textContent = currentQ.question;

  // Options
  const container = document.getElementById("quizOptionsContainer");
  container.innerHTML = "";

  const keys = ["A", "B", "C", "D"];
  currentQ.options.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.innerHTML = `
      <span class="option-key">${keys[idx]}</span>
      <span class="option-label">${escapeHtml(optText)}</span>
    `;

    btn.addEventListener("click", () => {
      handleOptionSelected(idx, btn);
    });

    container.appendChild(btn);
  });

  // Hide explanation and disable next button
  document.getElementById("quizExplanationBox").style.display = "none";
  document.getElementById("nextQuestionBtn").disabled = true;
}

function handleOptionSelected(selectedIdx, clickedBtn) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;

  const currentQ = state.quiz.shuffledQuestions[state.quiz.currentIndex];
  const isCorrect = selectedIdx === currentQ.correctIndex;
  const allBtns = document.querySelectorAll(".quiz-option-btn");

  allBtns.forEach(b => b.classList.add("locked"));

  if (isCorrect) {
    sfx.playCorrect();
    clickedBtn.classList.add("correct");
    state.quiz.scoreCorrect++;
    state.quiz.streak++;
    state.streak = (state.streak || 0) + 1;
  } else {
    sfx.playWrong();
    clickedBtn.classList.add("wrong");
    allBtns[currentQ.correctIndex].classList.add("correct");
    state.quiz.scoreWrong++;
    state.quiz.streak = 0;
    state.streak = 0;
  }

  // Update in-card score display immediately
  const quizScoreDisp = document.getElementById("quizScoreDisplay");
  if (quizScoreDisp) quizScoreDisp.textContent = `Rätt: ${state.quiz.scoreCorrect} | Fel: ${state.quiz.scoreWrong}`;

  // Dim untouched options
  allBtns.forEach((b, idx) => {
    if (idx !== selectedIdx && idx !== currentQ.correctIndex) {
      b.classList.add("dimmed");
    }
  });

  // Show explanation
  const expBox = document.getElementById("quizExplanationBox");
  const expTitle = document.getElementById("explanationHeader");
  const expIcon = document.getElementById("explanationIcon");
  const expText = document.getElementById("explanationText");
  const expRef = document.getElementById("explanationRef");

  if (isCorrect) {
    expIcon.textContent = "✅";
    expTitle.textContent = "Helt Rätt!";
    expTitle.style.color = "var(--color-success)";
  } else {
    expIcon.textContent = "❌";
    expTitle.textContent = "Tyvärr felaktigt svar";
    expTitle.style.color = "var(--primary-red)";
  }

  expText.textContent = currentQ.explanation;
  expRef.textContent = `Källa: ${currentQ.ref}`;
  expBox.style.display = "block";

  document.getElementById("nextQuestionBtn").disabled = false;
  updateGlobalScore();
}

function advanceQuizQuestion() {
  state.quiz.currentIndex++;
  if (state.quiz.currentIndex < state.quiz.shuffledQuestions.length) {
    renderCurrentQuizQuestion();
  } else {
    showQuizFinished();
  }
}

function showQuizFinished() {
  document.getElementById("quizCard").style.display = "none";
  const finishedCard = document.getElementById("quizFinishedCard");
  finishedCard.style.display = "block";

  const total = state.quiz.shuffledQuestions.length;
  const correct = state.quiz.scoreCorrect;
  const pct = Math.round((correct / total) * 100);

  sfx.playWin();

  document.getElementById("finalScoreLead").textContent = `Du fick ${correct} av ${total} rätt (${pct}%)`;
  document.getElementById("finalScoreBreakdown").innerHTML = `
    <div style="margin-bottom: 0.5rem;"><strong>Resultat:</strong></div>
    <div>✅ Antal rätt: <strong>${correct}</strong></div>
    <div>❌ Antal fel: <strong>${state.quiz.scoreWrong}</strong></div>
    <div>🔥 Högsta streak i omgången: <strong>${state.quiz.streak}</strong></div>
    <div style="margin-top: 0.8rem; font-size: 0.88rem; color: #ff99ac;">
      ${pct >= 85 ? '🌟 Fantastiskt! Du är helt redo för provet på FHRP & HSRP!' : pct >= 60 ? '👍 Bra jobbat! Träna lite mer på detaljer som MAC-adresser och VRRP för full pott.' : '💪 Fortsätt öva! Kolla fliken "Snabbguide & Provfusk" och kör en ny omgång.'}
    </div>
  `;
}

function updateGlobalScore() {
  const scoreEl = document.getElementById("globalQuizScore");
  const streakEl = document.getElementById("globalStreak");
  if (!scoreEl || !streakEl) return;

  const totalAnswered = (state.quiz.scoreCorrect + state.quiz.scoreWrong) +
                        (state.diginto ? (state.diginto.scoreCorrect + state.diginto.scoreWrong) : 0);
  const totalCorrect = state.quiz.scoreCorrect + (state.diginto ? state.diginto.scoreCorrect : 0);
  const currentStreak = Math.max(state.quiz.streak, state.diginto ? state.diginto.streak : 0);

  scoreEl.textContent = `${totalCorrect} / ${totalAnswered}`;
  streakEl.textContent = `🔥 ${currentStreak}`;
}

function getCategoryName(cat) {
  if (cat === "mac-calc") return "MAC-beräkning & ARP";
  switch (cat) {
    case "fhrp-intro": return "FHRP Protokolljämförelse";
    case "hsrp-core": return "HSRP Detaljer & MAC/Port";
    case "hsrp-states": return "HSRP 6 Tillstånd";
    case "vrrp-glbp": return "VRRP & GLBP";
    case "topology-cli": return "Topologi & Kommandon";
    default: return "Allmänt Prov";
  }
}

// ==========================================
// 7B. DIGINTO QUIZ IMPLEMENTATION
// ==========================================
function initDigintoQuiz() {
  const restartBtn = document.getElementById("restartDigintoBtn");
  const restartFinishedBtn = document.getElementById("restartFinishedDigintoBtn");
  const categoryFilter = document.getElementById("digintoCategoryFilter");
  const nextBtn = document.getElementById("nextDigintoBtn");
  const skipBtn = document.getElementById("skipDigintoBtn");

  if (!restartBtn) return;

  restartBtn.addEventListener("click", () => {
    sfx.playClick();
    startNewDigintoSession();
  });

  if (restartFinishedBtn) {
    restartFinishedBtn.addEventListener("click", () => {
      sfx.playClick();
      startNewDigintoSession();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", (e) => {
      state.diginto.category = e.target.value;
      startNewDigintoSession();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      sfx.playClick();
      advanceDigintoQuestion();
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      advanceDigintoQuestion();
    });
  }

  startNewDigintoSession();
}

function startNewDigintoSession() {
  let pool = DIGINTO_QUESTIONS;
  if (state.diginto.category !== "all") {
    pool = pool.filter(q => q.category === state.diginto.category);
  }

  // Automatically shuffle both questions and answer choices
  state.diginto.shuffledQuestions = shuffleArray(pool).map(q => {
    const correctText = q.options[q.correctIndex];
    const shuffledOpts = shuffleArray(q.options);
    const newCorrectIdx = shuffledOpts.indexOf(correctText);
    return {
      ...q,
      options: shuffledOpts,
      correctIndex: newCorrectIdx
    };
  });

  state.diginto.currentIndex = 0;
  state.diginto.scoreCorrect = 0;
  state.diginto.scoreWrong = 0;
  state.diginto.streak = 0;
  state.diginto.answered = false;

  updateGlobalScore();

  const card = document.getElementById("digintoCard");
  const finCard = document.getElementById("digintoFinishedCard");
  if (card) card.style.display = "block";
  if (finCard) finCard.style.display = "none";

  renderCurrentDigintoQuestion();
}

function renderCurrentDigintoQuestion() {
  const currentQ = state.diginto.shuffledQuestions[state.diginto.currentIndex];
  if (!currentQ) {
    showDigintoFinished();
    return;
  }

  state.diginto.answered = false;

  // Update Progress Bar
  const total = state.diginto.shuffledQuestions.length;
  const currentNum = state.diginto.currentIndex + 1;
  const percent = (currentNum / total) * 100;

  const stepText = document.getElementById("digintoStepText");
  const catBadge = document.getElementById("digintoCatBadge");
  const scoreDisp = document.getElementById("digintoScoreDisplay");
  const progBar = document.getElementById("digintoProgressBar");

  if (stepText) stepText.textContent = `Fråga ${currentNum} av ${total}`;
  if (catBadge) catBadge.textContent = getDigintoCategoryName(currentQ.category);
  if (scoreDisp) scoreDisp.textContent = `Rätt: ${state.diginto.scoreCorrect} | Fel: ${state.diginto.scoreWrong}`;
  if (progBar) progBar.style.width = `${percent}%`;

  // Question Card Elements
  const pill = document.getElementById("digintoNumberPill");
  const sourceTag = document.getElementById("digintoSourceTag");
  const qText = document.getElementById("digintoQuestionText");

  if (pill) pill.textContent = `#${currentNum}`;
  if (sourceTag) sourceTag.textContent = currentQ.sourceTag || "🌐 DIGINTO CCNA 2";
  if (qText) qText.textContent = currentQ.question;

  // Options
  const container = document.getElementById("digintoOptionsContainer");
  if (!container) return;
  container.innerHTML = "";

  const keys = ["A", "B", "C", "D"];
  currentQ.options.forEach((optText, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.innerHTML = `
      <span class="option-key">${keys[idx]}</span>
      <span class="option-label">${escapeHtml(optText)}</span>
    `;

    btn.addEventListener("click", () => {
      handleDigintoOptionSelected(idx, btn);
    });

    container.appendChild(btn);
  });

  // Reset explanation and next button
  const expBox = document.getElementById("digintoExplanationBox");
  const nextBtn = document.getElementById("nextDigintoBtn");
  if (expBox) expBox.style.display = "none";
  if (nextBtn) nextBtn.disabled = true;
}

function handleDigintoOptionSelected(selectedIdx, clickedBtn) {
  if (state.diginto.answered) return;
  state.diginto.answered = true;

  const currentQ = state.diginto.shuffledQuestions[state.diginto.currentIndex];
  const isCorrect = selectedIdx === currentQ.correctIndex;
  const container = document.getElementById("digintoOptionsContainer");
  const allBtns = container ? container.querySelectorAll(".quiz-option-btn") : [];

  allBtns.forEach(b => b.classList.add("locked"));

  if (isCorrect) {
    sfx.playCorrect();
    clickedBtn.classList.add("correct");
    state.diginto.scoreCorrect++;
    state.diginto.streak++;
    state.streak = (state.streak || 0) + 1;
  } else {
    sfx.playWrong();
    clickedBtn.classList.add("wrong");
    if (allBtns[currentQ.correctIndex]) {
      allBtns[currentQ.correctIndex].classList.add("correct");
    }
    state.diginto.scoreWrong++;
    state.diginto.streak = 0;
    state.streak = 0;
  }

  // Update in-card score display immediately
  const digintoScoreDisp = document.getElementById("digintoScoreDisplay");
  if (digintoScoreDisp) digintoScoreDisp.textContent = `Rätt: ${state.diginto.scoreCorrect} | Fel: ${state.diginto.scoreWrong}`;

  // Dim untouched options
  allBtns.forEach((b, idx) => {
    if (idx !== selectedIdx && idx !== currentQ.correctIndex) {
      b.classList.add("dimmed");
    }
  });

  // Show explanation
  const expBox = document.getElementById("digintoExplanationBox");
  const expTitle = document.getElementById("digintoExplanationHeader");
  const expIcon = document.getElementById("digintoExplanationIcon");
  const expText = document.getElementById("digintoExplanationText");
  const expRef = document.getElementById("digintoExplanationRef");

  if (isCorrect) {
    if (expIcon) expIcon.textContent = "✅";
    if (expTitle) {
      expTitle.textContent = "Helt Rätt!";
      expTitle.style.color = "var(--color-success)";
    }
  } else {
    if (expIcon) expIcon.textContent = "❌";
    if (expTitle) {
      expTitle.textContent = "Tyvärr felaktigt svar";
      expTitle.style.color = "var(--primary-red)";
    }
  }

  if (expText) expText.textContent = currentQ.explanation;
  if (expRef) expRef.textContent = `Källa: ${currentQ.ref}`;
  if (expBox) expBox.style.display = "block";

  const nextBtn = document.getElementById("nextDigintoBtn");
  if (nextBtn) nextBtn.disabled = false;
  updateGlobalScore();
}

function advanceDigintoQuestion() {
  state.diginto.currentIndex++;
  if (state.diginto.currentIndex < state.diginto.shuffledQuestions.length) {
    renderCurrentDigintoQuestion();
  } else {
    showDigintoFinished();
  }
}

function showDigintoFinished() {
  const card = document.getElementById("digintoCard");
  const finCard = document.getElementById("digintoFinishedCard");
  if (card) card.style.display = "none";
  if (finCard) finCard.style.display = "block";

  const total = state.diginto.shuffledQuestions.length;
  const correct = state.diginto.scoreCorrect;
  const pct = Math.round((correct / total) * 100);

  sfx.playWin();

  const lead = document.getElementById("digintoFinalScoreLead");
  const breakdown = document.getElementById("digintoFinalScoreBreakdown");

  if (lead) lead.textContent = `Du fick ${correct} av ${total} rätt (${pct}%)`;
  if (breakdown) {
    breakdown.innerHTML = `
      <div style="margin-bottom: 0.5rem;"><strong>Resultat för Diginto FHRP & HSRP:</strong></div>
      <div>✅ Antal rätt: <strong>${correct}</strong></div>
      <div>❌ Antal fel: <strong>${state.diginto.scoreWrong}</strong></div>
      <div>🔥 Högsta streak i omgången: <strong>${state.diginto.streak}</strong></div>
      <div style="margin-top: 0.8rem; font-size: 0.88rem; color: #ff99ac;">
        ${pct >= 85 ? '🌟 Mästerligt! Du behärskar alla Diginto-koncept inför provet!' : pct >= 60 ? '👍 Bra jobbat! Repetera reglerna för preemption och timers för maximal förståelse.' : '💪 Fortsätt öva! Läs igenom Diginto-länkarna och kör en ny omgång.'}
      </div>
    `;
  }
}

function getDigintoCategoryName(cat) {
  switch (cat) {
    case "multicast-timers": return "Multicast & Timers";
    case "election-preempt": return "Valprocess & Preemption";
    case "states-deep": return "HSRP 6 Tillstånd";
    case "glbp-deep": return "GLBP Lastbalansering";
    default: return "Diginto Kursmaterial";
  }
}

// ==========================================
// 8. CLI COMMANDS TRAINER (Tab 2)
// ==========================================
function initCommands() {
  // Category chips
  const chips = document.querySelectorAll(".cmd-cat-chip");
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      sfx.playClick();
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      state.commands.category = chip.getAttribute("data-cat");
      filterAndRenderCommands();
    });
  });

  // Mode buttons (Typing vs Cards)
  const typeBtn = document.getElementById("cmdModeTypeBtn");
  const cardBtn = document.getElementById("cmdModeCardBtn");

  typeBtn.addEventListener("click", () => {
    sfx.playClick();
    typeBtn.classList.add("active");
    cardBtn.classList.remove("active");
    document.getElementById("cmdTypingView").style.display = "block";
    document.getElementById("cmdCardsView").style.display = "none";
  });

  cardBtn.addEventListener("click", () => {
    sfx.playClick();
    cardBtn.classList.add("active");
    typeBtn.classList.remove("active");
    document.getElementById("cmdTypingView").style.display = "none";
    document.getElementById("cmdCardsView").style.display = "block";
    renderFlashcards();
  });

  // Terminal actions
  const input = document.getElementById("terminalInput");
  const submitBtn = document.getElementById("submitCmdBtn");
  const hintBtn = document.getElementById("showCmdHintBtn");
  const answerBtn = document.getElementById("showCmdAnswerBtn");
  const nextCmdBtn = document.getElementById("nextCmdBtn");

  submitBtn.addEventListener("click", () => submitTerminalCommand());
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      submitTerminalCommand();
    }
  });

  hintBtn.addEventListener("click", () => {
    const hintBox = document.getElementById("cmdHintBox");
    const cmd = state.commands.filteredList[state.commands.currentIndex];
    if (cmd) {
      document.getElementById("cmdHintText").textContent = cmd.hint;
      hintBox.style.display = "flex";
    }
  });

  answerBtn.addEventListener("click", () => {
    const cmd = state.commands.filteredList[state.commands.currentIndex];
    if (cmd) {
      input.value = cmd.canonical;
      input.focus();
    }
  });

  nextCmdBtn.addEventListener("click", () => {
    sfx.playClick();
    state.commands.currentIndex = (state.commands.currentIndex + 1) % state.commands.filteredList.length;
    renderCurrentCommand();
  });

  filterAndRenderCommands();
}

function filterAndRenderCommands() {
  if (state.commands.category === "all") {
    state.commands.filteredList = [...COMMANDS_DB];
  } else {
    state.commands.filteredList = COMMANDS_DB.filter(c => c.cat === state.commands.category);
  }
  state.commands.currentIndex = 0;
  renderCurrentCommand();
  renderCommandSidebar();
  renderFlashcards();
}

function renderCurrentCommand() {
  const cmd = state.commands.filteredList[state.commands.currentIndex];
  if (!cmd) return;

  document.getElementById("cmdTargetDevice").textContent = cmd.targetDevice;
  document.getElementById("termPrompt").textContent = cmd.targetDevice;
  document.getElementById("cmdCounter").textContent = `${state.commands.currentIndex + 1} / ${state.commands.filteredList.length}`;
  document.getElementById("cmdGoalTitle").textContent = cmd.title;
  document.getElementById("cmdGoalDesc").innerHTML = cmd.desc;
  document.getElementById("cmdHintBox").style.display = "none";
  document.getElementById("cmdFeedbackBar").style.display = "none";

  const input = document.getElementById("terminalInput");
  input.value = "";
  input.focus();

  // Reset terminal log
  const log = document.getElementById("terminalLog");
  log.innerHTML = `
    <div class="term-line output">Cisco IOS Software, C3650 Multilayer Switch CLI</div>
    <div class="term-line output">Mål: ${cmd.title}</div>
    <div class="term-line instruction">Skriv kommandot vid prompten nedan och tryck Enter:</div>
  `;

  // Highlight active in sidebar
  const items = document.querySelectorAll(".cmd-list-item");
  items.forEach((item, idx) => {
    if (idx === state.commands.currentIndex) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

function renderCommandSidebar() {
  const container = document.getElementById("commandQuickList");
  container.innerHTML = "";

  state.commands.filteredList.forEach((cmd, idx) => {
    const item = document.createElement("div");
    item.className = `cmd-list-item ${idx === state.commands.currentIndex ? 'active' : ''}`;
    item.innerHTML = `
      <div class="cmd-item-code">${escapeHtml(cmd.canonical)}</div>
      <div class="cmd-item-desc">${escapeHtml(cmd.title)}</div>
    `;

    item.addEventListener("click", () => {
      sfx.playClick();
      state.commands.currentIndex = idx;
      renderCurrentCommand();
    });

    container.appendChild(item);
  });
}

function renderFlashcards() {
  const container = document.getElementById("commandCardsGrid");
  container.innerHTML = "";

  state.commands.filteredList.forEach(cmd => {
    const card = document.createElement("div");
    card.className = "flashcard";
    card.innerHTML = `
      <div>
        <div class="fc-tag">${cmd.targetDevice}</div>
        <div class="fc-question">${cmd.title}</div>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem;">${cmd.desc}</p>
      </div>
      <div class="fc-answer">
        <code style="font-weight: 700;">${cmd.canonical}</code>
      </div>
    `;
    container.appendChild(card);
  });
}

function submitTerminalCommand() {
  const input = document.getElementById("terminalInput");
  const val = input.value.trim();
  if (!val) return;

  const cmd = state.commands.filteredList[state.commands.currentIndex];
  const isMatch = cmd.validRegex.test(val);
  const log = document.getElementById("terminalLog");
  const feedback = document.getElementById("cmdFeedbackBar");

  // Append user input to terminal
  const userLine = document.createElement("div");
  userLine.className = "term-line";
  userLine.innerHTML = `<strong>${cmd.targetDevice}</strong> ${escapeHtml(val)}`;
  log.appendChild(userLine);

  const responseLine = document.createElement("div");
  responseLine.className = `term-line ${isMatch ? 'success' : 'error'}`;

  if (isMatch) {
    sfx.playCorrect();
    responseLine.textContent = `% Rätt kommando! Syntax verifierad.`;
    log.appendChild(responseLine);

    feedback.className = "cmd-feedback-bar correct";
    feedback.textContent = `✅ Utmärkt! "${val}" är korrekt. ${cmd.explanation}`;
    feedback.style.display = "block";
  } else {
    sfx.playWrong();
    responseLine.textContent = `% Invalid input detected at '^' marker or syntax mismatch.`;
    log.appendChild(responseLine);

    feedback.className = "cmd-feedback-bar wrong";
    feedback.innerHTML = `❌ Felaktigt kommando. Rätt syntax är: <code class="code-inline">${cmd.canonical}</code>`;
    feedback.style.display = "block";
  }

  log.scrollTop = log.scrollHeight;
}

// ==========================================
// 9. FULL CONFIGURATIONS WORKSPACE (Tab 3)
// ==========================================
function initConfigWorkspace() {
  // Device selector buttons
  const devBtns = document.querySelectorAll(".device-btn");
  devBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sfx.playClick();
      devBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.config.currentDevice = btn.getAttribute("data-device");
      loadDeviceConfiguration();
    });
  });

  // Editor mode tabs
  const writeTab = document.getElementById("editorWriteTab");
  const guidedTab = document.getElementById("editorGuidedTab");
  const solTab = document.getElementById("editorSolutionTab");

  writeTab.addEventListener("click", () => setEditorMode("write"));
  guidedTab.addEventListener("click", () => setEditorMode("guided"));
  solTab.addEventListener("click", () => setEditorMode("solution"));

  // Editor tool buttons
  document.getElementById("loadTemplateBtn").addEventListener("click", () => {
    loadEditorTemplate();
  });

  document.getElementById("clearEditorBtn").addEventListener("click", () => {
    document.getElementById("configCodeEditor").value = "";
    updateLineNumbers();
  });

  document.getElementById("copySolutionBtn").addEventListener("click", () => {
    const dev = CONFIG_MODELS[state.config.currentDevice];
    if (dev) {
      navigator.clipboard.writeText(dev.fullSolution);
      alert("Facit kopierat till urklipp!");
    }
  });

  // Validation
  document.getElementById("validateConfigBtn").addEventListener("click", () => {
    validateUserConfiguration();
  });

  // Guided check
  document.getElementById("checkGuidedBtn").addEventListener("click", () => {
    validateGuidedInputs();
  });

  // Code editor textarea line numbers sync
  const textarea = document.getElementById("configCodeEditor");
  textarea.addEventListener("input", updateLineNumbers);
  textarea.addEventListener("scroll", () => {
    document.getElementById("editorLineNumbers").scrollTop = textarea.scrollTop;
  });

  loadDeviceConfiguration();
}

function setEditorMode(mode) {
  sfx.playClick();
  state.config.mode = mode;

  document.getElementById("editorWriteTab").classList.toggle("active", mode === "write");
  document.getElementById("editorGuidedTab").classList.toggle("active", mode === "guided");
  document.getElementById("editorSolutionTab").classList.toggle("active", mode === "solution");

  document.getElementById("editorTextView").style.display = mode === "write" ? "block" : "none";
  document.getElementById("editorGuidedView").style.display = mode === "guided" ? "block" : "none";
  document.getElementById("editorSolutionView").style.display = mode === "solution" ? "block" : "none";
  document.getElementById("validationDrawer").style.display = "none";

  if (mode === "guided") {
    renderGuidedInputs();
  }
}

function loadDeviceConfiguration() {
  const dev = CONFIG_MODELS[state.config.currentDevice];
  if (!dev) return;

  document.getElementById("cfgContextTitle").textContent = dev.contextTitle;
  document.getElementById("cfgRoleBadge").textContent = dev.role;
  document.getElementById("cfgImportantNote").textContent = dev.note;

  // Render params table
  const table = document.getElementById("cfgParamsTable");
  table.innerHTML = "";
  dev.params.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(p.key)}</td><td>${escapeHtml(p.val)}</td>`;
    table.appendChild(tr);
  });

  // Update Mini Topology SVG
  renderMiniTopology(state.config.currentDevice);

  // Update Solution block
  document.getElementById("solutionCodeBlock").textContent = dev.fullSolution;

  // Update Guided View if active
  if (state.config.mode === "guided") {
    renderGuidedInputs();
  }

  // Reset Drawer
  document.getElementById("validationDrawer").style.display = "none";
}

function updateLineNumbers() {
  const textarea = document.getElementById("configCodeEditor");
  const lines = textarea.value.split("\n").length;
  const lineNumbersEl = document.getElementById("editorLineNumbers");
  lineNumbersEl.innerHTML = Array.from({ length: Math.max(lines, 1) }, (_, i) => i + 1).join("\n");
}

function loadEditorTemplate() {
  const dev = CONFIG_MODELS[state.config.currentDevice];
  let template = "";
  if (state.config.currentDevice === "isp") {
    template = `Switch>enable\nSwitch#configure terminal\nSwitch(config)#hostname ISP\nISP(config)#ip routing\nISP(config)#interface g1/0/3\n! Skriv länk mot MLS1 här...\n\nISP(config)#ip route ...`;
  } else if (state.config.currentDevice === "mls1") {
    template = `MLS1>en\nMLS1#conf t\nMLS1(config)#ip routing\nMLS1(config)#interface g1/0/2\n! Konfigurera access mot S1 här...\n\nMLS1(config)#interface vlan 10\n! Konfigurera SVI och HSRP här...\n\nMLS1(config)#interface g1/0/3\n! Konfigurera länk mot ISP här...\n\nMLS1(config)#ip route 0.0.0.0 0.0.0.0 ...`;
  } else {
    template = `MLS2>en\nMLS2#conf t\nMLS2(config)#ip routing\nMLS2(config)#interface g1/0/2\n! Konfigurera access mot S1 här...\n\nMLS2(config)#interface vlan 10\n! Konfigurera SVI och HSRP här...\n\nMLS2(config)#interface g1/0/4\n! Konfigurera länk mot ISP här...\n\nMLS2(config)#ip route 0.0.0.0 0.0.0.0 ...`;
  }
  const textarea = document.getElementById("configCodeEditor");
  textarea.value = template;
  updateLineNumbers();
}

function renderGuidedInputs() {
  const dev = CONFIG_MODELS[state.config.currentDevice];
  const container = document.getElementById("guidedInputsContainer");
  container.innerHTML = "";

  dev.guidedItems.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = "guided-line-row";
    row.innerHTML = `
      <div class="guided-prompt-prefix">${item.prefix}</div>
      <input type="text" class="guided-input" data-idx="${idx}" placeholder="${escapeHtml(item.label)}" autocomplete="off" spellcheck="false">
    `;
    container.appendChild(row);
  });
}

function validateGuidedInputs() {
  const dev = CONFIG_MODELS[state.config.currentDevice];
  const inputs = document.querySelectorAll(".guided-input");
  let correctCount = 0;

  inputs.forEach((input, idx) => {
    const expected = dev.guidedItems[idx].target.toLowerCase().replace(/\s+/g, " ").trim();
    const actual = input.value.toLowerCase().replace(/\s+/g, " ").trim();

    if (actual === expected || isLooseCommandMatch(actual, expected)) {
      input.classList.remove("wrong");
      input.classList.add("correct");
      correctCount++;
    } else {
      input.classList.remove("correct");
      input.classList.add("wrong");
    }
  });

  if (correctCount === dev.guidedItems.length) {
    sfx.playWin();
    alert(`🎉 Perfekt! Alla ${correctCount} rader är helt rätt!`);
  } else {
    sfx.playWrong();
    alert(`Du hade ${correctCount} av ${dev.guidedItems.length} rätt. De felaktiga raderna är rödmarkerade.`);
  }
}

function validateUserConfiguration() {
  const userText = document.getElementById("configCodeEditor").value;
  const dev = CONFIG_MODELS[state.config.currentDevice];
  const drawer = document.getElementById("validationDrawer");
  const detailsList = document.getElementById("validationDetailsList");
  const scoreBadge = document.getElementById("drawerScoreBadge");

  drawer.style.display = "block";
  detailsList.innerHTML = "";

  // Normalize user lines
  const userLines = userText
    .split("\n")
    .map(l => l.replace(/^[a-zA-Z0-9_-]+(\(config[a-z-]*\))?#\s*/i, "").trim()) // strip Cisco prompt prefix if pasted
    .filter(l => l && !l.startsWith("!") && !l.startsWith("%"));

  // Check expected key command blocks
  const expectedItems = dev.guidedItems;
  let matches = 0;

  expectedItems.forEach(item => {
    const target = item.target.toLowerCase();
    const found = userLines.some(ul => isLooseCommandMatch(ul.toLowerCase(), target));

    const row = document.createElement("div");
    if (found) {
      matches++;
      row.className = "val-item match";
      row.innerHTML = `<span>✓</span> <div><strong>${escapeHtml(item.target)}</strong> — ${escapeHtml(item.label)}</div>`;
    } else {
      row.className = "val-item missing";
      row.innerHTML = `<span>✕</span> <div><strong>Saknas: ${escapeHtml(item.target)}</strong> (${escapeHtml(item.label)})</div>`;
    }
    detailsList.appendChild(row);
  });

  const percentage = Math.round((matches / expectedItems.length) * 100);
  scoreBadge.textContent = `${percentage}% rätt (${matches}/${expectedItems.length})`;

  if (percentage >= 90) {
    sfx.playCorrect();
    scoreBadge.style.color = "var(--color-success)";
    document.getElementById("editorValidationSummary").textContent = `🎉 Utmärkt! Konfigurationen för ${dev.name} är godkänd.`;
  } else {
    sfx.playWrong();
    scoreBadge.style.color = "var(--primary-red)";
    document.getElementById("editorValidationSummary").textContent = `Se feedback nedan för saknade kommandon (${percentage}% matchning).`;
  }
}

function isLooseCommandMatch(actual, expected) {
  // Normalize whitespace
  actual = actual.replace(/\s+/g, " ").trim();
  expected = expected.replace(/\s+/g, " ").trim();

  if (actual === expected) return true;

  // Common Cisco abbreviations
  const synonyms = [
    { from: /\bconf\s+t\b/g, to: "configure terminal" },
    { from: /\bint\b/g, to: "interface" },
    { from: /\bsw\s+mo\s+acc\b/g, to: "switchport mode access" },
    { from: /\bsw\s+acc\s+vlan\b/g, to: "switchport access vlan" },
    { from: /\bno\s+shut\b/g, to: "no shutdown" },
    { from: /\bip\s+addr\b/g, to: "ip address" },
    { from: /\bcopy\s+run\s+start\b/g, to: "copy running-config startup-config" }
  ];

  let normAct = actual;
  synonyms.forEach(s => normAct = normAct.replace(s.from, s.to));

  return normAct === expected;
}

function renderMiniTopology(deviceKey) {
  const svg = document.getElementById("miniTopoSvg");
  // Simple illustrative SVG based on active device
  let colorMls1 = deviceKey === "mls1" ? "#ff2a5f" : "#552233";
  let colorMls2 = deviceKey === "mls2" ? "#ff9900" : "#553311";
  let colorIsp = deviceKey === "isp" ? "#e60039" : "#441122";

  svg.innerHTML = `
    <line x1="270" y1="50" x2="130" y2="150" stroke="${deviceKey === 'mls1' || deviceKey === 'isp' ? '#ff2a5f' : '#331520'}" stroke-width="3"/>
    <line x1="270" y1="50" x2="410" y2="150" stroke="${deviceKey === 'mls2' || deviceKey === 'isp' ? '#ff9900' : '#331520'}" stroke-width="3" stroke-dasharray="4,4"/>
    <line x1="130" y1="150" x2="270" y2="230" stroke="#00d2ff" stroke-width="2.5"/>
    <line x1="410" y1="150" x2="270" y2="230" stroke="#00d2ff" stroke-width="2.5"/>

    <!-- ISP -->
    <circle cx="270" cy="50" r="24" fill="${colorIsp}" stroke="#fff" stroke-width="2"/>
    <text x="270" y="55" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">ISP</text>
    <text x="270" y="22" fill="#a0aec0" font-size="9" text-anchor="middle">203.0.113.1 / .5</text>

    <!-- MLS1 -->
    <circle cx="130" cy="150" r="28" fill="${colorMls1}" stroke="#fff" stroke-width="${deviceKey === 'mls1' ? '3' : '1.5'}"/>
    <text x="130" y="154" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">MLS1</text>
    <text x="130" y="195" fill="#ff99ac" font-size="9" text-anchor="middle">SVI: .2 | Prio 105</text>

    <!-- MLS2 -->
    <circle cx="410" cy="150" r="28" fill="${colorMls2}" stroke="#fff" stroke-width="${deviceKey === 'mls2' ? '3' : '1.5'}"/>
    <text x="410" y="154" fill="#fff" font-size="11" font-weight="bold" text-anchor="middle">MLS2</text>
    <text x="410" y="195" fill="#ffb300" font-size="9" text-anchor="middle">SVI: .3 | Prio 100</text>

    <!-- Virtual Router Center -->
    <rect x="200" y="135" width="140" height="30" rx="5" fill="#0d1b2a" stroke="#00d2ff" stroke-width="1.2"/>
    <text x="270" y="154" fill="#00f2fe" font-size="10" font-weight="bold" text-anchor="middle">VIP: 192.168.10.1</text>

    <!-- S1 -->
    <rect x="235" y="215" width="70" height="24" rx="4" fill="#1a202c" stroke="#00d2ff" stroke-width="1.5"/>
    <text x="270" y="231" fill="#fff" font-size="10" text-anchor="middle">S1 (Switch)</text>
  `;
}

// ==========================================
// 10. INTERACTIVE TOPOLOGY & NODE INSPECTOR (Tab 4)
// ==========================================
function initTopologies() {
  const topoBtns = document.querySelectorAll(".topo-tab-btn");
  topoBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sfx.playClick();
      topoBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const targetTopo = btn.getAttribute("data-topo");
      document.getElementById("topoView1").style.display = targetTopo === "topo1" ? "block" : "none";
      document.getElementById("topoView2").style.display = targetTopo === "topo2" ? "block" : "none";
    });
  });

  // Node clicks in Topology 1
  setupNodeClick("node-mls1", "MLS1 (Multilayer Switch)", "Active HSRP Gateway", `
    <strong>Port Gig1/0/3:</strong> 203.0.113.2 /30 mot ISP (Routad L3-port via <code class="code-inline">no switchport</code>)<br>
    <strong>Port Gig1/0/2:</strong> Accessport för VLAN 10 mot S1<br>
    <strong>Interface VLAN 10:</strong> Fysisk IP 192.168.10.2 /24<br>
    <strong>HSRP Konfiguration:</strong> Grupp 10, Virtuell IP 192.168.10.1, Prioritet 105, Preempt PÅ, Track g1/0/3.<br>
    <em>Detta är den aktiva routern som normalt hanterar all klienttrafik!</em>
  `);

  setupNodeClick("node-mls2", "MLS2 (Multilayer Switch)", "Standby HSRP Gateway", `
    <strong>Port Gig1/0/4:</strong> 203.0.113.6 /30 mot ISP (Routad L3-port)<br>
    <strong>Port Gig1/0/2:</strong> Accessport för VLAN 10 mot S1<br>
    <strong>Interface VLAN 10:</strong> Fysisk IP 192.168.10.3 /24<br>
    <strong>HSRP Konfiguration:</strong> Grupp 10, Virtuell IP 192.168.10.1, Prioritet 100, Preempt PÅ.<br>
    <em>Tar över omedelbart om MLS1 går ner eller om MLS1:s prioritet sjunker via tracking!</em>
  `);

  setupNodeClick("node-isp", "ISP (Internet Service Provider Switch)", "Internet Gateway", `
    <strong>Port Gig1/0/3:</strong> 203.0.113.1 /30 mot MLS1<br>
    <strong>Port Gig1/0/4:</strong> 203.0.113.5 /30 mot MLS2<br>
    <strong>Port Gig1/0/24:</strong> SERVER_NETWORK (8.8.8.8/28)<br>
    <strong>Statisk rutt:</strong> <code class="code-inline">ip route 192.168.10.0 255.255.255.0 203.0.113.2</code> (Primär)<br>
    <strong>Floating route:</strong> <code class="code-inline">ip route 192.168.10.0 255.255.255.0 203.0.113.6 5</code> (Reserv med AD 5)
  `);

  setupNodeClick("node-s1", "S1 (Layer 2 Access Switch)", "L2 Switch", `
    <strong>Port Gig0/1:</strong> Ansluten till MLS1 Gig1/0/2<br>
    <strong>Port Gig0/2:</strong> Ansluten till MLS2 Gig1/0/2<br>
    <strong>Port Fa0/1:</strong> Accessport ansluten till PC0 (Klient)<br>
    <em>Distribuerar VLAN 10 till klienterna i nätverket.</em>
  `);

  setupNodeClick("node-pc0", "PC0 (Klientdator)", "End Host", `
    <strong>IP-konfiguration:</strong> IP-adress i subnätet 192.168.10.0/24<br>
    <strong>Default Gateway:</strong> <code class="code-inline">192.168.10.1</code> (Den virtuella HSRP-adressen!)<br>
    <em>Klienten konfigureras ALDRIG med MLS1 (.2) eller MLS2 (.3) direkt, för att behålla redundansen.</em>
  `);

  setupNodeClick("node-server", "Server0", "Internet Resurs", `
    <strong>IP-nätverk:</strong> 8.8.8.8 /28 ansluten på ISP port Gig1/0/24.<br>
    <em>Simulerar internetresurs (t.ex. Google DNS).</em>
  `);
}

function setupNodeClick(nodeId, title, badge, contentHtml) {
  const node = document.getElementById(nodeId);
  if (!node) return;

  node.addEventListener("click", () => {
    sfx.playClick();
    document.getElementById("topoInfoTitle").textContent = title;
    document.getElementById("topoInfoBadge").textContent = badge;
    document.getElementById("topoInfoBody").innerHTML = contentHtml;
  });
}

// Helper: Escape HTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
